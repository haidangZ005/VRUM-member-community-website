const env = require('../../infrastructure/config/env');
const RegisterUser = require('../../application/use-cases/auth/RegisterUser');
const LoginUser = require('../../application/use-cases/auth/LoginUser');
const RefreshSession = require('../../application/use-cases/auth/RefreshSession');
const LogoutUser = require('../../application/use-cases/auth/LogoutUser');
const ForgotPassword = require('../../application/use-cases/auth/ForgotPassword');
const ResetPassword = require('../../application/use-cases/auth/ResetPassword');
const UpdateProfile = require('../../application/use-cases/auth/UpdateProfile');
const GetProfile = require('../../application/use-cases/users/GetProfile');
const CreatePost = require('../../application/use-cases/posts/CreatePost');
const ListPosts = require('../../application/use-cases/posts/ListPosts');
const GetPostDetail = require('../../application/use-cases/posts/GetPostDetail');
const EditPost = require('../../application/use-cases/posts/EditPost');
const DeletePost = require('../../application/use-cases/posts/DeletePost');
const SetPostVote = require('../../application/use-cases/posts/SetPostVote');
const RecordPostView = require('../../application/use-cases/posts/RecordPostView');
const SetPostHidden = require('../../application/use-cases/posts/SetPostHidden');
const MarkPostNotInterested = require('../../application/use-cases/posts/MarkPostNotInterested');
const CreateComment = require('../../application/use-cases/comments/CreateComment');
const EditComment = require('../../application/use-cases/comments/EditComment');
const ListCommentsByPost = require('../../application/use-cases/comments/ListCommentsByPost');
const SetCommentVote = require('../../application/use-cases/comments/SetCommentVote');
const ListMembers = require('../../application/use-cases/admin/ListMembers');
const LockMemberAccount = require('../../application/use-cases/admin/LockMemberAccount');
const UnlockMemberAccount = require('../../application/use-cases/admin/UnlockMemberAccount');
const AdminListPosts = require('../../application/use-cases/admin/AdminListPosts');
const AdminDeletePost = require('../../application/use-cases/admin/AdminDeletePost');
const AdminListComments = require('../../application/use-cases/admin/AdminListComments');
const ModerateComment = require('../../application/use-cases/admin/ModerateComment');
const ListCategories = require('../../application/use-cases/admin/ListCategories');
const CreateCategory = require('../../application/use-cases/admin/CreateCategory');
const UpdateCategory = require('../../application/use-cases/admin/UpdateCategory');
const DeleteCategory = require('../../application/use-cases/admin/DeleteCategory');
const GetDashboardStats = require('../../application/use-cases/admin/GetDashboardStats');

function makeUseCases(dependencies) {
  const {
    userRepository, refreshTokenRepository, resetTokenRepository, hashService, tokenService, emailService,
    postRepository, commentRepository, voteRepository, categoryRepository,
  } = dependencies;
  return {
    registerUser: new RegisterUser({ userRepository, hashService }),
    loginUser: new LoginUser({ userRepository, hashService, tokenService, refreshTokenRepository }),
    refreshSession: new RefreshSession({ userRepository, tokenService, refreshTokenRepository }),
    logoutUser: new LogoutUser({ refreshTokenRepository, tokenService }),
    forgotPassword: new ForgotPassword({ userRepository, resetTokenRepository, tokenService, emailService, clientUrl: env.CLIENT_URL }),
    resetPassword: new ResetPassword({ userRepository, resetTokenRepository, refreshTokenRepository, hashService, tokenService }),
    updateProfile: new UpdateProfile({ userRepository }),
    getProfile: new GetProfile({ userRepository }),
    createPost: new CreatePost({ postRepository, categoryRepository }),
    listPosts: new ListPosts({ postRepository }),
    getPostDetail: new GetPostDetail({ postRepository }),
    editPost: new EditPost({ postRepository, categoryRepository }),
    deletePost: new DeletePost({ postRepository }),
    setPostVote: new SetPostVote({ postRepository, voteRepository }),
    recordPostView: new RecordPostView({ postRepository }),
    setPostHidden: new SetPostHidden({ postRepository }),
    markPostNotInterested: new MarkPostNotInterested({ postRepository }),
    createComment: new CreateComment({ postRepository, commentRepository }),
    editComment: new EditComment({ postRepository, commentRepository }),
    listCommentsByPost: new ListCommentsByPost({ postRepository, commentRepository }),
    setCommentVote: new SetCommentVote({ postRepository, commentRepository, voteRepository }),
    listMembers: new ListMembers({ userRepository }),
    lockMemberAccount: new LockMemberAccount({ userRepository, refreshTokenRepository }),
    unlockMemberAccount: new UnlockMemberAccount({ userRepository }),
    adminListPosts: new AdminListPosts({ postRepository }),
    adminDeletePost: new AdminDeletePost({ postRepository }),
    adminListComments: new AdminListComments({ commentRepository }),
    moderateComment: new ModerateComment({ commentRepository }),
    listAdminCategories: new ListCategories({ categoryRepository }),
    createCategory: new CreateCategory({ categoryRepository }),
    updateCategory: new UpdateCategory({ categoryRepository }),
    deleteCategory: new DeleteCategory({ categoryRepository }),
    getDashboardStats: new GetDashboardStats({ userRepository, postRepository, commentRepository, categoryRepository }),
  };
}

module.exports = makeUseCases;
