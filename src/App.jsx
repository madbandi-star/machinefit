function App() {
  return (
    <div
      style={{
        background: "#111",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ color: "#FFD400", fontSize: "48px" }}>
        🏋️ SeatFit
      </h1>

      <h2>Hammer Strength Seat Guide</h2>

      <p>React + Vite + PWA</p>

      <button
        style={{
          marginTop: "30px",
          padding: "15px 30px",
          fontSize: "20px",
          borderRadius: "10px",
          border: "none",
          background: "#FFD400",
          cursor: "pointer",
        }}
        onClick={() => alert("정상적으로 동작합니다!진짜루")}
      >
        테스트 버튼
      </button>
    </div>
  );
}

export default App;