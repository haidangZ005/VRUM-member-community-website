import { ArrowRight, LoaderCircle } from 'lucide-react';

export default function SubmitButton({ children, isPending, disabled = false }) {
  return (
    <button className="primary-button" type="submit" disabled={isPending || disabled}>
      {isPending ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}
      {isPending ? 'Đang xử lý...' : children}
    </button>
  );
}

