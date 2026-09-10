import { ArrowBigDown, ArrowBigUp } from 'lucide-react';

export default function VoteControl({ score = 0, viewerVote = 0, onVote, pending = false, compact = false, label = 'Bình chọn' }) {
  const choose = (direction) => onVote(viewerVote === direction ? 0 : direction);
  return <div className={`vote-control ${compact ? 'compact' : ''}`} aria-label={label}>
    <button type="button" className={viewerVote === 1 ? 'selected up' : ''} disabled={pending} aria-label="Upvote" aria-pressed={viewerVote === 1} onClick={(event) => { event.preventDefault(); choose(1); }}><ArrowBigUp size={compact ? 18 : 20} fill={viewerVote === 1 ? 'currentColor' : 'none'} /></button>
    <span aria-label={`${score} điểm`}>{score}</span>
    <button type="button" className={viewerVote === -1 ? 'selected down' : ''} disabled={pending} aria-label="Downvote" aria-pressed={viewerVote === -1} onClick={(event) => { event.preventDefault(); choose(-1); }}><ArrowBigDown size={compact ? 18 : 20} fill={viewerVote === -1 ? 'currentColor' : 'none'} /></button>
  </div>;
}
