interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "Loading..." }: LoadingScreenProps) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white font-mono text-lg">{message}</p>
      </div>
    </div>
  );
}; 