export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        width: "100%",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid rgba(0,0,0,0.1)",
          borderTopColor: "#f26740",
          animation: "hmp-spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes hmp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
