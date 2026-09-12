const pool = require('../connection');
const env = require('../../../config/env');
const BcryptHashService = require('../../../services/BcryptHashService');

const avatar = (fullName, color) => {
  const initials = fullName.split(' ').filter(Boolean).map((part) => part[0]).slice(-2).join('').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#${color}"/><circle cx="49" cy="15" r="13" fill="#fff" opacity=".2"/><text x="32" y="41" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" font-weight="700" fill="white">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
const members = [
  ['minh_anh', 'minhanh@example.com', 'Nguyễn Minh Anh', 'f97316'],
  ['quang_huy', 'quanghuy@example.com', 'Trần Quang Huy', '2563eb'],
  ['thu_trang', 'thutrang@example.com', 'Lê Thu Trang', 'db2777'],
  ['lan_phuong', 'lanphuong@example.com', 'Phạm Lan Phương', '9333ea'],
  ['duc_long', 'duclong@example.com', 'Vũ Đức Long', '0891b2'],
  ['hai_yen', 'haiyen@example.com', 'Đỗ Hải Yến', '059669'],
  ['bao_ngoc', 'baongoc@example.com', 'Hoàng Bảo Ngọc', 'dc2626'],
  ['gia_bao', 'giabao@example.com', 'Ngô Gia Bảo', 'ca8a04'],
  ['khanh_linh', 'khanhlinh@example.com', 'Bùi Khánh Linh', '4f46e5'],
  ['tuan_kiet', 'tuankiet@example.com', 'Đặng Tuấn Kiệt', '0f766e'],
].map(([username, email, fullName, color]) => ({ username, email, fullName, avatarUrl: avatar(fullName, color) }));

const demoJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAASACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD0uiiivwc/qgKKKKACiiigAooooA//2Q==';
const categories = [
  ['Hỏi đáp', 'Đặt câu hỏi và cùng nhau tìm lời giải thực tế'],
  ['Chia sẻ', 'Kinh nghiệm học tập, làm việc và phát triển bản thân'],
  ['Dự án', 'Giới thiệu dự án, cập nhật tiến độ và tìm cộng sự'],
  ['Công nghệ', 'Lập trình, dữ liệu, sản phẩm và công cụ số'],
  ['Đời sống', 'Sách, sức khỏe, hoạt động và câu chuyện thường ngày'],
];
const posts = [
  ['meeting', 0, 'Chia sẻ', 2, 'Ba cách giúp buổi họp nhóm hiệu quả hơn', 'Nhóm mình gửi agenda trước, giới hạn mỗi chủ đề trong 15 phút và chốt người phụ trách cùng deadline. Sau ba tuần, thời gian họp giảm gần một nửa.'],
  ['documents', 1, 'Hỏi đáp', 4, 'Mọi người quản lý tài liệu dự án như thế nào?', 'Tài liệu đang nằm rải rác ở Drive và Notion. Mọi người có quy tắc đặt tên, phân quyền và lưu phiên bản nào dễ dùng không?'],
  ['book_exchange', 2, 'Dự án', 7, 'Tìm cộng sự cho hoạt động đổi sách cuối tuần', 'Sự kiện diễn ra sáng Chủ nhật. Mình cần hai bạn phân loại sách và một bạn chụp ảnh. Hãy bình luận khung giờ bạn tham gia được nhé!'],
  ['presentation', 3, 'Chia sẻ', 10, 'Checklist chuẩn bị buổi thuyết trình nhóm', 'Checklist gồm mục tiêu, thời lượng, thông điệp chính, thiết bị dự phòng và phần hỏi đáp. @minh_anh bổ sung thêm kinh nghiệm nhé.'],
  ['postgres', 4, 'Công nghệ', 14, 'Lộ trình tự học PostgreSQL trong 30 ngày', 'Tuần đầu học truy vấn; tuần hai tập trung index và explain; tuần ba làm transaction; tuần cuối xây API tìm kiếm.'],
  ['space', 5, 'Đời sống', 18, 'Không gian sinh hoạt cộng đồng đã mở cửa', 'Khu đọc sách có 120 đầu sách, tám bàn làm việc và wifi miễn phí. Không gian mở từ 8:00 đến 21:00 mỗi ngày.', [demoJpeg]],
  ['react', 6, 'Công nghệ', 23, 'Kinh nghiệm giảm thời gian tải trang React', 'Nhóm mình tách bundle theo route, trì hoãn ảnh ngoài màn hình và cache request. LCP giảm từ 3,8 giây xuống 1,7 giây.'],
  ['internship', 7, 'Hỏi đáp', 29, 'Sinh viên năm ba nên chuẩn bị gì để xin thực tập?', 'Mình có hai dự án cá nhân nhưng chưa biết CV cần mô tả mức độ đóng góp thế nào. Nhà tuyển dụng thường ưu tiên điều gì?'],
  ['volunteer', 8, 'Dự án', 36, 'Tuyển tình nguyện viên cho lớp học tin học cơ bản', 'Dự án hỗ trợ người lớn tuổi dùng điện thoại vào tối thứ Ba và thứ Năm. Đội cần thêm bốn bạn trong ít nhất ba tuần.'],
  ['docker', 9, 'Công nghệ', 44, 'Docker Compose cho môi trường phát triển của nhóm', 'Mình đã gom PostgreSQL, backend và frontend vào cùng compose file, thêm healthcheck và dữ liệu mẫu cho thành viên mới.'],
  ['reading', 2, 'Đời sống', 52, 'Thử thách đọc 20 trang mỗi ngày trong tháng này', 'Mỗi tối mình dành 30 phút đọc và ghi lại ba ý chính. Cuối tháng chúng ta sẽ có một buổi trao đổi ngắn.'],
  ['feedback', 0, 'Hỏi đáp', 63, 'Làm sao góp ý thẳng mà đồng đội không bị tổn thương?', 'Mình nói về hành vi cụ thể và tác động thay vì đánh giá con người, nhưng đôi lúc cuộc trao đổi vẫn căng thẳng.'],
  ['api', 1, 'Công nghệ', 75, 'Một số nguyên tắc thiết kế REST API dễ bảo trì', 'Tên tài nguyên dạng số nhiều, status code nhất quán, lỗi có mã máy đọc được và pagination đồng nhất giúp client dễ tích hợp.'],
  ['running', 5, 'Đời sống', 88, 'Nhóm chạy bộ 5 km sáng thứ Bảy', 'Điểm hẹn là cổng công viên lúc 6:00, tốc độ nhẹ. Người mới có thể chạy xen kẽ đi bộ và không cần đăng ký trước.', [demoJpeg]],
  ['design', 3, 'Dự án', 104, 'Chia sẻ bản thử nghiệm design system cho VRUM', 'Bản đầu có token màu sắc, typography, button, input và loading. Mình cần góp ý về độ tương phản và khoảng cách.'],
  ['index', 4, 'Công nghệ', 121, 'Case study: thêm index đúng chỗ cho trang tìm kiếm', 'Sau khi xem execution plan và thêm GIN index, thời gian truy vấn trung bình giảm từ hơn 900 ms xuống khoảng 70 ms.'],
  ['career', 6, 'Chia sẻ', 146, 'Những điều mình học được sau năm đầu làm frontend', 'Đọc yêu cầu, hỏi đúng câu hỏi, đo hiệu năng và giao tiếp sớm khi gặp vướng mắc giúp mình tiến bộ nhanh hơn.'],
  ['hackathon', 9, 'Dự án', 168, 'Đăng ký đội thi hackathon sản phẩm cộng đồng', 'Đội đã có backend và UI/UX, đang tìm một bạn frontend cho sản phẩm kết nối tình nguyện viên địa phương.'],
].map(([key, authorIndex, category, hoursAgo, title, content, images = []]) => ({ key, author: members[authorIndex].email, category, hoursAgo, title, content, images }));

const comments = [
  ['meeting_huy', 'meeting', 1, 'Phần chốt người phụ trách rất hữu ích. Nhóm mình sẽ thử thêm biên bản một trang.'],
  ['meeting_ngoc', 'meeting', 6, 'Bọn mình còn luân phiên người điều phối để mọi thành viên đều được luyện kỹ năng.'],
  ['documents_trang', 'documents', 2, 'Nhóm mình chia theo chủ đề và thêm ngày cập nhật vào tên tài liệu.'],
  ['documents_kiet', 'documents', 9, 'Nên có README ở thư mục gốc giải thích cấu trúc và người sở hữu từng phần.'],
  ['book_minh', 'book_exchange', 0, 'Mình tham gia được buổi sáng và có thể mang thêm khoảng 15 cuốn sách.'],
  ['book_yen', 'book_exchange', 5, 'Mình nhận phần chụp ảnh nhé. Bạn gửi giúp mình timeline chương trình.'],
  ['presentation_minh', 'presentation', 0, 'Mình đề xuất tập thử một lần và chuẩn bị người xử lý câu hỏi ngoài phạm vi.'],
  ['postgres_kiet', 'postgres', 9, 'Bạn có thể thêm bài tập backup, restore và quan sát connection pool.'],
  ['space_trang', 'space', 2, 'Không gian rất sáng và yên tĩnh. Cuối tuần mình sẽ ghé khu đọc sách.'],
  ['react_huy', 'react', 1, 'Con số LCP cải thiện rõ ràng. Bạn có đo trên thiết bị di động cấu hình thấp không?'],
  ['internship_ngoc', 'internship', 6, 'CV nên ghi rõ vấn đề, phần bạn làm và kết quả đo được. Một dự án hoàn chỉnh tốt hơn nhiều repo dang dở.'],
  ['volunteer_minh', 'volunteer', 0, 'Mình có thể tham gia tối thứ Năm trong bốn tuần liên tiếp.'],
  ['docker_long', 'docker', 4, 'Có dữ liệu seed rõ ràng sẽ giúp thành viên mới kiểm tra giao diện ngay sau khi chạy.'],
  ['reading_linh', 'reading', 8, 'Mình đang đọc Atomic Habits và muốn tham gia thử thách này.'],
  ['feedback_phuong', 'feedback', 3, 'Mình thường hỏi trước xem người kia có sẵn sàng nhận góp ý không rồi mới trao đổi.'],
  ['api_long', 'api', 4, 'Thêm idempotency key cho những thao tác quan trọng cũng giúp client retry an toàn hơn.'],
  ['running_bao', 'running', 7, 'Mình mới chạy được khoảng 2 km, có thể tham gia theo nhóm đi bộ xen kẽ không?'],
  ['design_ngoc', 'design', 6, 'Mình sẽ thử áp dụng vào trang tìm kiếm và ghi lại các component còn thiếu.'],
  ['index_huy', 'index', 1, 'Bạn chia sẻ thêm kích thước bảng và câu explain analyze nhé.'],
  ['career_bao', 'career', 7, 'Cảm ơn chia sẻ, phần giao tiếp sớm là điều mình thường bỏ qua.'],
  ['hackathon_ngoc', 'hackathon', 6, 'Mình quan tâm vị trí frontend. Tối nay mình sẽ gửi portfolio.'],
].map(([key, post, memberIndex, content]) => ({ key, post, author: members[memberIndex].email, content }));
const replies = [
  ['book_exchange', 2, 'book_minh', 'Tuyệt quá, mình đã ghi tên bạn vào ca sáng. Cảm ơn @minh_anh nhé!'],
  ['internship', 7, 'internship_ngoc', 'Cảm ơn chị, em sẽ sửa CV theo cấu trúc vấn đề - hành động - kết quả.'],
  ['running', 5, 'running_bao', 'Được bạn nhé, nhóm luôn có một người dẫn tốc độ chậm cho thành viên mới.'],
  ['design', 3, 'design_ngoc', 'Cảm ơn bạn, mình đã mở bảng feedback để tổng hợp component còn thiếu.'],
].map(([post, memberIndex, parent, content]) => ({ post, author: members[memberIndex].email, parent, content }));

async function seedDemo() {
  if (!env.DEMO_PASSWORD) throw new Error('Cần cấu hình DEMO_PASSWORD có ít nhất 8 ký tự');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await new BcryptHashService().hash(env.DEMO_PASSWORD);
    const userIds = new Map();
    for (const member of members) {
      const { rows } = await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, avatar_url, role, status)
         VALUES ($1,$2,$3,$4,$5,'member','active') ON CONFLICT (email) DO UPDATE SET
         username=EXCLUDED.username,password_hash=EXCLUDED.password_hash,full_name=EXCLUDED.full_name,
         avatar_url=EXCLUDED.avatar_url,role='member',status='active' RETURNING id`,
        [member.username, member.email, passwordHash, member.fullName, member.avatarUrl],
      );
      userIds.set(member.email, rows[0].id);
    }
    const demoUserIds = [...userIds.values()];
    await client.query(
      'DELETE FROM comments WHERE author_id = ANY($1::uuid[]) AND content = ANY($2::text[])',
      [demoUserIds, [
        'Cảm ơn bạn, phần chốt người phụ trách rất hữu ích.',
        'Mình quan tâm và có thể hỗ trợ khung giờ buổi sáng.',
        'Mình đã xem và trả lời trực tiếp bình luận của bạn @minh_anh.',
      ]],
    );
    await client.query(
      'DELETE FROM posts WHERE author_id = ANY($1::uuid[]) AND title = ANY($2::text[])',
      [demoUserIds, [
        'Nên bắt đầu học PostgreSQL từ đâu?',
        'Ảnh cập nhật không gian sinh hoạt cộng đồng',
      ]],
    );
    for (const [name, description] of categories) {
      await client.query(`INSERT INTO categories (name,description) VALUES ($1,$2)
        ON CONFLICT (name) DO UPDATE SET description=EXCLUDED.description`, [name, description]);
    }
    const categoryRows = (await client.query('SELECT id,name FROM categories')).rows;
    const categoryIds = new Map(categoryRows.map(({ id, name }) => [name, id]));
    const postIds = new Map();
    for (const post of posts) {
      const params = [userIds.get(post.author), categoryIds.get(post.category), post.title, post.content, JSON.stringify(post.images), post.hoursAgo];
      const { rows } = await client.query(
        `WITH found AS (SELECT id FROM posts WHERE author_id=$1 AND title=$3 ORDER BY created_at LIMIT 1),
         changed AS (UPDATE posts SET category_id=$2,content=$4,images=$5::jsonb,
         created_at=now()-($6::int*interval '1 hour'),updated_at=now() WHERE id=(SELECT id FROM found) RETURNING id)
         INSERT INTO posts (author_id,category_id,title,content,images,created_at,updated_at)
         SELECT $1,$2,$3,$4,$5::jsonb,now()-($6::int*interval '1 hour'),now()
         WHERE NOT EXISTS (SELECT 1 FROM changed) RETURNING id`, params,
      );
      const id = rows[0]?.id || (await client.query('SELECT id FROM posts WHERE author_id=$1 AND title=$2 ORDER BY created_at LIMIT 1', [params[0], post.title])).rows[0].id;
      postIds.set(post.key, id);
    }
    const commentIds = new Map();
    const ensureComment = async ({ key, post, author, content, parentId = null }) => {
      const params = [postIds.get(post), userIds.get(author), content, parentId];
      const found = (await client.query(`SELECT id,post_id FROM comments WHERE post_id=$1 AND author_id=$2
        AND content=$3 AND parent_id IS NOT DISTINCT FROM $4 ORDER BY created_at LIMIT 1`, params)).rows[0];
      const row = found || (await client.query('INSERT INTO comments (post_id,author_id,content,parent_id) VALUES ($1,$2,$3,$4) RETURNING id,post_id', params)).rows[0];
      if (key) commentIds.set(key, row.id);
      return row;
    };
    for (const comment of comments) await ensureComment(comment);
    const replyRows = [];
    for (const reply of replies) replyRows.push(await ensureComment({ ...reply, parentId: commentIds.get(reply.parent) }));

    const demoPostIds = [...postIds.values()];
    const demoCommentIds = [...commentIds.values(), ...replyRows.map(({ id }) => id)];
    await client.query('DELETE FROM post_votes WHERE post_id = ANY($1::uuid[]) AND user_id = ANY($2::uuid[])', [demoPostIds, demoUserIds]);
    await client.query('DELETE FROM comment_votes WHERE comment_id = ANY($1::uuid[]) AND user_id = ANY($2::uuid[])', [demoCommentIds, demoUserIds]);
    await client.query('DELETE FROM community_memberships WHERE user_id = ANY($1::uuid[]) AND category_id = ANY($2::uuid[])', [demoUserIds, categories.map(([name]) => categoryIds.get(name))]);
    await client.query('DELETE FROM post_views WHERE user_id = ANY($1::uuid[]) AND post_id = ANY($2::uuid[])', [demoUserIds, demoPostIds]);
    await client.query('DELETE FROM hidden_posts WHERE user_id = ANY($1::uuid[]) AND post_id = ANY($2::uuid[])', [demoUserIds, demoPostIds]);

    const postVotes = [['meeting',1,1],['meeting',2,1],['meeting',3,1],['meeting',4,1],['meeting',5,1],['meeting',6,1],['meeting',7,1],['documents',2,1],['documents',4,1],['documents',8,-1],['book_exchange',0,1],['book_exchange',5,1],['react',0,1],['react',1,1],['react',4,1],['internship',3,1],['volunteer',0,1],['volunteer',2,1],['docker',4,1],['docker',6,1],['reading',8,1],['api',4,1],['api',9,1],['running',7,1],['design',6,1],['index',1,1],['hackathon',6,1]];
    for (const [post, member, value] of postVotes) await client.query(`INSERT INTO post_votes (post_id,user_id,value) VALUES ($1,$2,$3)
      ON CONFLICT (post_id,user_id) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`, [postIds.get(post), userIds.get(members[member].email), value]);
    const commentVotes = [['meeting_huy',0,1],['meeting_huy',2,1],['meeting_ngoc',1,1],['documents_trang',4,1],['documents_kiet',0,-1],['book_yen',2,1],['postgres_kiet',4,1],['internship_ngoc',7,1],['volunteer_minh',8,1],['docker_long',9,1],['feedback_phuong',0,1],['index_huy',4,1]];
    for (const [comment, member, value] of commentVotes) await client.query(`INSERT INTO comment_votes (comment_id,user_id,value) VALUES ($1,$2,$3)
      ON CONFLICT (comment_id,user_id) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`, [commentIds.get(comment), userIds.get(members[member].email), value]);

    const memberships = [[0,'Chia sẻ',true],[0,'Công nghệ',true],[0,'Đời sống',false],[1,'Công nghệ',true],[2,'Dự án',true],[3,'Chia sẻ',true],[4,'Công nghệ',true],[5,'Đời sống',true],[6,'Công nghệ',true],[7,'Hỏi đáp',false],[8,'Dự án',true],[9,'Công nghệ',true]];
    for (const [member, category, favorite] of memberships) await client.query(`INSERT INTO community_memberships (user_id,category_id,is_favorite) VALUES ($1,$2,$3)
      ON CONFLICT (user_id,category_id) DO UPDATE SET is_favorite=EXCLUDED.is_favorite`, [userIds.get(members[member].email), categoryIds.get(category), favorite]);
    const recipientId = userIds.get(members[0].email);
    await client.query(`INSERT INTO post_views (user_id,post_id) VALUES ($1,$2),($1,$3)
      ON CONFLICT (user_id,post_id) DO UPDATE SET viewed_at=now()`, [recipientId, postIds.get('documents'), postIds.get('react')]);
    await client.query('INSERT INTO hidden_posts (user_id,post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [recipientId, postIds.get('book_exchange')]);
    const notifications = [
      ['POST_COMMENT',1,'comment',commentIds.get('meeting_huy'),{ actorUsername:'quang_huy',postTitle:posts[0].title,excerpt:comments[0].content,postId:postIds.get('meeting') },'seed:post-comment'],
      ['COMMENT_REPLY',2,'comment',replyRows[0].id,{ actorUsername:'thu_trang',postTitle:posts[2].title,excerpt:replies[0].content,postId:postIds.get('book_exchange'),commentId:replyRows[0].id },'seed:comment-reply'],
      ['MENTION',3,'post',postIds.get('presentation'),{ actorUsername:'lan_phuong',postTitle:posts[3].title,excerpt:posts[3].content,postId:postIds.get('presentation') },'seed:mention'],
      ['POST_VOTE_MILESTONE',null,'post',postIds.get('meeting'),{ postTitle:posts[0].title,score:7,postId:postIds.get('meeting') },'seed:vote-milestone'],
      ['CONTENT_MODERATED',null,'post',postIds.get('book_exchange'),{ title:posts[2].title,reason:'Dữ liệu mẫu để kiểm tra thông báo kiểm duyệt.',postId:postIds.get('book_exchange') },'seed:moderated'],
    ];
    for (const [type, actor, entityType, entityId, payload, dedupeKey] of notifications) await client.query(
      `INSERT INTO notifications (recipient_id,actor_id,type,entity_type,entity_id,payload,dedupe_key) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)
       ON CONFLICT (dedupe_key) DO UPDATE SET recipient_id=EXCLUDED.recipient_id,actor_id=EXCLUDED.actor_id,
       entity_type=EXCLUDED.entity_type,entity_id=EXCLUDED.entity_id,payload=EXCLUDED.payload,read_at=NULL,created_at=now()`,
      [recipientId, actor === null ? null : userIds.get(members[actor].email), type, entityType, entityId, JSON.stringify(payload), dedupeKey],
    );
    await require('./seedAvatars')(client);
    await client.query('COMMIT');
    console.log(`Đã tạo ${members.length} thành viên, ${posts.length} bài viết, ${comments.length + replies.length} bình luận và dữ liệu tương tác demo.`);
    console.log(`Tài khoản demo: ${members.map(({ email }) => email).join(', ')}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seedDemo().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
