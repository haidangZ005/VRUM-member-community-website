import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Pencil, Reply, Trash2 } from 'lucide-react';
import { useComments, useCommentMutation, useSetCommentVote } from '../hooks/useComments';
import { useAuthStore } from '../../../store/authStore';
import ImageAttachments, { AttachedImages } from '../../../components/ui/ImageAttachments';
import VoteControl from '../../../components/ui/VoteControl';
import UserAvatar from '../../../components/ui/UserAvatar';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
const errorMessage = (error) => error?.response?.data?.error?.message || 'Không thể lưu bình luận. Vui lòng thử lại.';

function CommentComposer({ postId, comment, parentId, onDone, onCancel }) {
  const mutation = useCommentMutation(postId, comment ? 'update' : 'create');
  const [content, setContent] = useState(comment?.content || '');
  const [images, setImages] = useState(comment?.images || []);
  const [readingImages, setReadingImages] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    if (content.trim().length < 2 || readingImages || mutation.isPending) return;
    mutation.mutate({ content: content.trim(), images, ...(comment ? { id: comment.id } : { parentId: parentId || null }) }, {
      onSuccess: () => { setContent(''); setImages([]); onDone?.(); },
    });
  };
  return <form className="comment-composer" onSubmit={submit}>
    <textarea value={content} onChange={(event) => setContent(event.target.value)} rows="3" maxLength="2000" placeholder="Đóng góp góc nhìn của bạn…" aria-label={comment ? 'Chỉnh sửa bình luận' : parentId ? 'Nội dung trả lời' : 'Nội dung bình luận'} disabled={mutation.isPending} />
    {mutation.error && <div className="alert error" role="alert">{errorMessage(mutation.error)}</div>}
    <ImageAttachments value={images} onChange={setImages} disabled={mutation.isPending} onBusyChange={setReadingImages} />
    {readingImages && <p role="status">Đang xử lý ảnh…</p>}
    <div className="comment-controls">{onCancel && <button className="comment-cancel" type="button" onClick={onCancel} disabled={mutation.isPending}>Hủy</button>}<button type="submit" disabled={mutation.isPending || content.trim().length < 2}><Send size={17} />{mutation.isPending ? 'Đang lưu…' : comment ? 'Lưu thay đổi' : parentId ? 'Gửi trả lời' : 'Gửi bình luận'}</button></div>
  </form>;
}

function CommentItem({ categoryId, postId, comment, parent, childrenByParent, userId, loginState, replyTo, clearReplyIntent }) {
  const [mode, setMode] = useState(userId && comment.id === replyTo ? 'reply' : null);
  const navigate = useNavigate();
  const remove = useCommentMutation(postId, 'remove');
  const vote = useSetCommentVote(postId, comment.id);
  const name = comment.author?.fullName || comment.author?.username || 'Thành viên';
  return <div className="comment-thread">
    <article className="comment-item" id={`comment-${comment.id}`}>
      <UserAvatar user={comment.author} small categoryId={categoryId} />
      <div className="comment-body"><div className="comment-meta"><strong>{name}</strong><time dateTime={comment.createdAt}>{dateFormatter.format(new Date(comment.createdAt))}</time></div>
        {parent && <a className="comment-parent-link" href={`#comment-${parent.id}`}><Reply size={13} /> Trả lời {parent.author?.fullName || parent.author?.username || 'Thành viên'}: <span>{parent.content}</span></a>}
        {mode === 'edit' ? <CommentComposer postId={postId} comment={comment} onDone={() => setMode(null)} onCancel={() => setMode(null)} /> : <p>{comment.content}</p>}
        {mode !== 'edit' && <AttachedImages images={comment.images} />}
        <div className="comment-actions">
          <VoteControl score={comment.score} viewerVote={comment.viewerVote} compact pending={vote.isPending} label="Bình chọn bình luận" onVote={(value) => { if (userId) vote.mutate(value); else navigate('/login', { state: { from: `${loginState.fromBase}#comment-${comment.id}` } }); }} />
          {userId ? <button type="button" onClick={() => setMode(mode === 'reply' ? null : 'reply')} disabled={remove.isPending}><Reply size={15} /> Trả lời</button> : <Link to="/login" state={{ from: `${loginState.fromBase}${loginState.fromBase.includes('?') ? '&' : '?'}replyTo=${encodeURIComponent(comment.id)}#comment-${comment.id}` }}><Reply size={15} /> Đăng nhập để trả lời</Link>}
          {comment.authorId === userId && <><button type="button" onClick={() => setMode('edit')} disabled={remove.isPending}><Pencil size={15} /> Sửa</button><button type="button" disabled={remove.isPending} onClick={() => { if (window.confirm('Xóa bình luận này? Các câu trả lời vẫn được giữ lại.')) remove.mutate({ id: comment.id }); }}><Trash2 size={15} />{remove.isPending ? 'Đang xóa…' : 'Xóa'}</button></>}
        </div>
        {remove.error && <div className="alert error" role="alert">{errorMessage(remove.error)}</div>}
        {mode === 'reply' && <CommentComposer postId={postId} parentId={comment.id} onDone={() => { setMode(null); clearReplyIntent(); }} onCancel={() => { setMode(null); clearReplyIntent(); }} />}
      </div>
    </article>
    {childrenByParent.get(comment.id)?.length > 0 && <div className="comment-replies">{childrenByParent.get(comment.id).map((child) => <CommentItem categoryId={categoryId} key={child.id} postId={postId} comment={child} parent={comment} childrenByParent={childrenByParent} userId={userId} loginState={loginState} replyTo={replyTo} clearReplyIntent={clearReplyIntent} />)}</div>}
  </div>;
}

export default function CommentList({ postId, categoryId }) {
  const comments = useComments(postId);
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const params = new URLSearchParams(location.search);
  const replyTo = params.get('replyTo');
  params.delete('replyTo');
  const baseSearch = params.toString();
  const loginState = { from: `${location.pathname}${baseSearch ? `?${baseSearch}` : ''}#comments`, fromBase: `${location.pathname}${baseSearch ? `?${baseSearch}` : ''}` };
  const clearReplyIntent = () => { if (replyTo) navigate(loginState.from, { replace: true }); };
  const items = comments.data || [];
  const ids = new Set(items.map((comment) => comment.id));
  const childrenByParent = new Map();
  for (const comment of items) {
    const parent = ids.has(comment.parentId) ? comment.parentId : null;
    if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
    childrenByParent.get(parent).push(comment);
  }
  useEffect(() => {
    if (replyTo && items.length > 0) document.getElementById(`comment-${replyTo}`)?.scrollIntoView({ block: 'center' });
  }, [items.length, replyTo]);
  return <section className="comments-section" id="comments">
    <div className="section-title"><h2><MessageSquare size={23} /> {items.length} bình luận</h2></div>
    {userId ? <CommentComposer postId={postId} /> : <div className="empty-comments"><Link to="/login" state={loginState}>Đăng nhập để bình luận hoặc trả lời</Link></div>}
    <div className="comment-list">
      {comments.isLoading && <p className="muted-copy">Đang tải bình luận…</p>}
      {comments.error && <div className="alert error" role="alert">Không thể tải bình luận. <button onClick={() => comments.refetch()}>Thử lại</button></div>}
      {childrenByParent.get(null)?.map((comment) => <CommentItem categoryId={categoryId} key={comment.id} postId={postId} comment={comment} childrenByParent={childrenByParent} userId={userId} loginState={loginState} replyTo={replyTo} clearReplyIntent={clearReplyIntent} />)}
      {!comments.isLoading && !comments.error && items.length === 0 && <div className="empty-comments">Chưa có bình luận. Hãy là người mở đầu cuộc trò chuyện.</div>}
    </div>
  </section>;
}
