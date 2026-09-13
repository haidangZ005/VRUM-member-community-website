import { ChevronUp, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react';
import { useId, useState } from 'react';
import { useSummarizePost } from '../hooks/usePosts';

function SummaryContent({ text }) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const items = lines.map((line) => line.replace(/^[-*•]\s*/, '')).filter(Boolean);
  const isList = lines.length > 1 && lines.every((line) => /^[-*•]\s*/.test(line));
  return isList
    ? <ul>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
    : <div className="ai-summary-text">{lines.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}</div>;
}

export default function PostSummary({ postId }) {
  const summary = useSummarizePost(postId);
  const [collapsed, setCollapsed] = useState(false);
  const titleId = useId();

  if (!summary.data && !summary.isPending && !summary.error) {
    return <button type="button" className="ai-summary-trigger" onClick={() => summary.mutate()}><Sparkles size={17} /> Tóm tắt bằng AI</button>;
  }

  if (summary.isPending) {
    return (
      <section className="ai-summary-panel ai-summary-loading" aria-live="polite">
        <div className="ai-summary-heading"><LoaderCircle className="spin" size={18} /><strong>Đang đọc và tóm tắt bài viết…</strong></div>
        <div className="ai-summary-skeleton" aria-hidden="true"><span /><span /><span /></div>
      </section>
    );
  }

  if (summary.error) {
    return (
      <section className="ai-summary-panel ai-summary-error" role="alert">
        <div><strong>Không thể tóm tắt lúc này</strong><p>{summary.error.response?.data?.error?.message || 'Dịch vụ AI đang tạm thời gián đoạn.'}</p></div>
        <button type="button" onClick={() => summary.mutate()}><RotateCcw size={16} /> Thử lại</button>
      </section>
    );
  }

  if (collapsed) {
    return <button type="button" className="ai-summary-trigger" onClick={() => setCollapsed(false)}><Sparkles size={17} /> Xem lại tóm tắt AI</button>;
  }

  return (
    <section className="ai-summary-panel" aria-labelledby={titleId}>
      <header className="ai-summary-heading"><span><Sparkles size={18} /><strong id={titleId}>Tóm tắt bởi AI</strong></span><button type="button" onClick={() => setCollapsed(true)}><ChevronUp size={17} /> Thu gọn</button></header>
      <SummaryContent text={summary.data.summary} />
      <small>AI có thể diễn giải chưa chính xác. Hãy đối chiếu với nội dung gốc.</small>
    </section>
  );
}
