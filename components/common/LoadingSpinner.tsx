interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  message = 'Učitavanje...', 
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`text-center py-20 ${className}`}>
      <div className="text-gray-400">{message}</div>
    </div>
  );
}
