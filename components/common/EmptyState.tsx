interface EmptyStateProps {
  message: string;
  className?: string;
}

export default function EmptyState({ 
  message, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-20 ${className}`}>
      <p className="text-gray-400">{message}</p>
    </div>
  );
}
