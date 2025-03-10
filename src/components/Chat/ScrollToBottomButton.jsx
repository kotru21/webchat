const ScrollToBottomButton = ({ show, onClick }) => {
  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 flex items-center space-x-2 z-50 animate-bounce">
      <span>↓</span>
      <span>Перейти к новым сообщениям</span>
    </button>
  );
};

export default ScrollToBottomButton;
