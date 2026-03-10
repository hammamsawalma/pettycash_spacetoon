export default function WelcomeLoading() {
    return (
        <div className="welcome-container" dir="rtl">
            {/* Background decorations */}
            <div className="welcome-bg-orb welcome-bg-orb-1" />
            <div className="welcome-bg-orb welcome-bg-orb-2" />
            <div className="welcome-bg-orb welcome-bg-orb-3" />

            <div className="welcome-step welcome-step-active" style={{ textAlign: "center" }}>
                {/* Logo with pulse animation */}
                <div className="welcome-logo-wrap">
                    <div
                        className="welcome-logo-img-container"
                        style={{ animation: "logo-glow 1.5s ease-in-out infinite" }}
                    >
                        <img
                            src="/spacetoon-logo.png"
                            alt="Spacetoon Logo"
                            className="welcome-logo-img"
                        />
                    </div>
                </div>

                <h1 className="welcome-title">
                    <span className="welcome-title-gradient">Spacetoon Pocket</span>
                </h1>

                {/* Loading spinner */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "2rem",
                }}>
                    <div style={{
                        width: "32px",
                        height: "32px",
                        border: "3px solid rgba(147, 197, 253, 0.3)",
                        borderTopColor: "#93c5fd",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                    }} />
                </div>

                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        </div>
    );
}
