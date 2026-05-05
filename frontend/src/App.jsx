import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { fetchAtlasStatus, fetchHealth, login, sendAtlasChat } from "./api.js";

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function rectToBox(rect) {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

async function typeButtonText(text, setButtonText, isCancelled, delay = 30) {
  for (let index = 0; index <= text.length; index += 1) {
    if (isCancelled()) {
      return false;
    }

    setButtonText(`${text.slice(0, index)}|`);
    await wait(delay);
  }

  return true;
}

async function eraseButtonText(text, setButtonText, isCancelled, delay = 24) {
  for (let index = text.length; index >= 0; index -= 1) {
    if (isCancelled()) {
      return false;
    }

    setButtonText(`${text.slice(0, index)}|`);
    await wait(delay);
  }

  return true;
}

function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cursor = { x: 0, y: 0, active: false };

    let width = 0;
    let height = 0;
    let particles = [];
    let animationFrame = 0;
    let lastTime = performance.now();

    function createParticles() {
      const count = Math.min(120, Math.max(58, Math.floor((width * height) / 12500)));

      particles = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 10 + Math.random() * 22;

        return {
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.75 + Math.random() * 1.15,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 0.28 + Math.random() * 0.42,
          tint: Math.random() > 0.72 ? "cyan" : "white",
        };
      });
    }

    function resizeCanvas() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      createParticles();
    }

    function wrapParticle(particle) {
      const margin = 24;

      if (particle.x < -margin) {
        particle.x = width + margin;
      } else if (particle.x > width + margin) {
        particle.x = -margin;
      }

      if (particle.y < -margin) {
        particle.y = height + margin;
      } else if (particle.y > height + margin) {
        particle.y = -margin;
      }
    }

    function draw(now) {
      const delta = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;

      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        if (!reduceMotion.matches) {
          particle.x += particle.vx * delta;
          particle.y += particle.vy * delta;
          wrapParticle(particle);
        }

        context.beginPath();
        context.fillStyle =
          particle.tint === "cyan"
            ? `rgba(125, 244, 255, ${particle.alpha})`
            : `rgba(255, 255, 255, ${particle.alpha})`;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }

      if (cursor.active) {
        const range = 155;

        for (const particle of particles) {
          const dx = particle.x - cursor.x;
          const dy = particle.y - cursor.y;
          const distance = Math.hypot(dx, dy);

          if (distance < range) {
            const opacity = (1 - distance / range) * 0.36;

            context.beginPath();
            context.strokeStyle = `rgba(125, 244, 255, ${opacity})`;
            context.lineWidth = 1;
            context.moveTo(cursor.x, cursor.y);
            context.lineTo(particle.x, particle.y);
            context.stroke();
          }
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    }

    function handlePointerMove(event) {
      cursor.x = event.clientX;
      cursor.y = event.clientY;
      cursor.active = true;
    }

    function handlePointerLeave() {
      cursor.active = false;
    }

    resizeCanvas();
    animationFrame = window.requestAnimationFrame(draw);

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return <canvas className="background-canvas" ref={canvasRef} aria-hidden="true" />;
}

function MiniAtlasMark({ active = false }) {
  return (
    <span className={`mini-atlas-mark ${active ? "mini-atlas-mark-active" : ""}`} aria-hidden="true">
      <span className="mini-atlas-orbit" />
      <span className="mini-atlas-core" />
    </span>
  );
}

const SUGGESTED_PROMPTS = [
  "Show me the protected route status",
  "Summarize what this demo proves",
];

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(() => localStorage.getItem("atlas_token") || "");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("atlas_email") || "");

  const [atlasStatus, setAtlasStatus] = useState(null);
  const [health, setHealth] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authTransition, setAuthTransition] = useState("idle");
  const [pendingAuth, setPendingAuth] = useState(null);
  const [authMorph, setAuthMorph] = useState(null);
  const [dashboardEntering, setDashboardEntering] = useState(false);
  const [signingReady, setSigningReady] = useState(false);
  const [buttonText, setButtonText] = useState("Sign in");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const authButtonRef = useRef(null);
  const chatComposerRef = useRef(null);
  const chatInputRef = useRef(null);
  const chatThreadRef = useRef(null);

  const isLoggedIn = useMemo(() => Boolean(token), [token]);
  const isLoginTransitioning = authTransition !== "idle";
  const isHandoff = authTransition === "handoff";
  const showChatStage = isLoggedIn || isHandoff;
  const showPasswordField = email.trim().length > 0;
  const lastAtlasMessageIndex = chatMessages.reduce(
    (latestIndex, message, index) => (message.role === "atlas" ? index : latestIndex),
    -1
  );

  const suggestions = (
    <div className="suggestions" aria-label="Suggested prompts">
      <span>Suggested</span>
      {SUGGESTED_PROMPTS.map((prompt) => (
        <button
          type="button"
          disabled={chatLoading}
          key={prompt}
          onClick={() => sendChatMessage(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "offline", app: "Atlas", database: "unknown" }));
  }, []);

  useEffect(() => {
    if (!token) {
      setAtlasStatus(null);
      return;
    }

    loadAtlasStatus(token);
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      chatInputRef.current?.focus();
    }, dashboardEntering ? 760 : 120);

    return () => window.clearTimeout(timer);
  }, [dashboardEntering, isLoggedIn]);

  useEffect(() => {
    if (!dashboardEntering) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setDashboardEntering(false);
    }, 920);

    return () => window.clearTimeout(timer);
  }, [dashboardEntering]);

  useEffect(() => {
    if (authTransition !== "signing") {
      return;
    }

    let cancelled = false;

    async function runSigningText() {
      setButtonText("Sign in|");
      await wait(90);

      const erased = await eraseButtonText("Sign in", setButtonText, () => cancelled);
      if (!cancelled && erased) {
        await wait(260);
      }

      if (!cancelled && erased) {
        setSigningReady(true);
      }
    }

    runSigningText();

    return () => {
      cancelled = true;
    };
  }, [authTransition]);

  useEffect(() => {
    if (authTransition === "signing" && signingReady && pendingAuth) {
      setAuthTransition("authenticated");
    }
  }, [authTransition, pendingAuth, signingReady]);

  useEffect(() => {
    if (!pendingAuth) {
      return;
    }

    if (authTransition === "authenticated") {
      let cancelled = false;

      async function runAuthenticatedText() {
        const typed = await typeButtonText("Authenticated", setButtonText, () => cancelled);
        if (!typed || cancelled) {
          return;
        }

        setButtonText("Authenticated");
        await wait(360);

        const erased = await eraseButtonText("Authenticated", setButtonText, () => cancelled, 22);
        if (!cancelled && erased) {
          setAuthTransition("welcome");
        }
      }

      runAuthenticatedText();

      return () => {
        cancelled = true;
      };
    }

    if (authTransition === "welcome") {
      let cancelled = false;

      async function runWelcomeText() {
        const typed = await typeButtonText("Welcome", setButtonText, () => cancelled, 32);
        if (!typed || cancelled) {
          return;
        }

        setButtonText("Welcome");
        await wait(420);

        if (!cancelled) {
          const sourceRect = authButtonRef.current?.getBoundingClientRect();
          setAuthMorph(sourceRect ? { source: rectToBox(sourceRect), target: null, phase: "measuring" } : null);
          setAuthTransition("handoff");
        }
      }

      runWelcomeText();

      return () => {
        cancelled = true;
      };
    }

  }, [authTransition, pendingAuth]);

  useEffect(() => {
    if (authTransition !== "handoff" || !pendingAuth) {
      return undefined;
    }

    if (!authMorph) {
      completeAuthentication(pendingAuth);
      return undefined;
    }

    if (authMorph.phase !== "measuring") {
      return undefined;
    }

    let animationFrame = 0;
    let settleTimer = 0;

    animationFrame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const handoffDuration = reduceMotion ? 0 : 760;
      const targetRect = chatComposerRef.current?.getBoundingClientRect();

      if (!targetRect) {
        setAuthMorph(null);
        completeAuthentication(pendingAuth);
        return;
      }

      setAuthMorph((current) =>
        current ? { ...current, target: rectToBox(targetRect), phase: "running" } : current
      );

      settleTimer = window.setTimeout(() => {
        completeAuthentication(pendingAuth);
        setAuthMorph((current) => (current ? { ...current, phase: "settled" } : current));
      }, handoffDuration);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
    };
  }, [authTransition, pendingAuth]);

  useEffect(() => {
    if (authMorph?.phase !== "settled") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setAuthMorph(null);
    }, 140);

    return () => window.clearTimeout(timer);
  }, [authMorph?.phase]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const thread = chatThreadRef.current;
    if (!thread) {
      return;
    }

    thread.scrollTo({
      top: thread.scrollHeight,
      behavior: chatLoading ? "smooth" : "auto",
    });
  }, [chatLoading, chatMessages, isLoggedIn]);

  async function handleLogin(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    setError("");
    setLoading(true);
    setPendingAuth(null);
    setAuthMorph(null);
    setDashboardEntering(false);
    setSigningReady(false);
    setButtonText("Sign in");
    setAuthTransition("signing");

    try {
      const data = await login(email.trim(), password);
      const authenticatedEmail = data.email || email.trim();

      setPendingAuth({ token: data.access_token, email: authenticatedEmail });
      setPassword("");
    } catch (err) {
      setPendingAuth(null);
      setAuthMorph(null);
      setDashboardEntering(false);
      setSigningReady(false);
      setButtonText("Sign in");
      setAuthTransition("idle");
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function completeAuthentication(authData) {
    localStorage.setItem("atlas_token", authData.token);
    localStorage.setItem("atlas_email", authData.email);

    setDashboardEntering(true);
    setToken(authData.token);
    setUserEmail(authData.email);
    setPendingAuth(null);
    setSigningReady(false);
    setButtonText("Sign in");
    setAuthTransition("idle");
  }

  async function loadAtlasStatus(activeToken = token) {
    setError("");
    setLoading(true);

    try {
      const data = await fetchAtlasStatus(activeToken);
      setAtlasStatus(data);
    } catch (err) {
      setError(err.message || "Protected request failed");
      handleLogout();
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("atlas_token");
    localStorage.removeItem("atlas_email");

    setToken("");
    setUserEmail("");
    setAtlasStatus(null);
    setPendingAuth(null);
    setAuthMorph(null);
    setDashboardEntering(false);
    setSigningReady(false);
    setButtonText("Sign in");
    setAuthTransition("idle");
    setEmail("");
    setPassword("");
    setChatInput("");
    setChatMessages([]);
    setChatLoading(false);
  }

  async function sendChatMessage(rawMessage) {
    const message = rawMessage.trim();
    if (!message || !token || chatLoading) {
      return;
    }

    setError("");
    setChatInput("");
    setChatMessages((messages) => [...messages, { role: "user", text: message }]);
    setChatLoading(true);

    try {
      const data = await sendAtlasChat(token, message);
      setChatMessages((messages) => [...messages, { role: "atlas", text: data.reply }]);
    } catch (err) {
      setError(err.message || "Atlas chat failed");
    } finally {
      setChatLoading(false);
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();
    await sendChatMessage(chatInput);
  }

  return (
    <>
      <AnimatedBackground />
      <main className={`login-page ${showChatStage ? "atlas-chat-page" : ""}`}>
        <section
          className={`login-card ${isLoginTransitioning ? "is-transitioning" : ""} ${
            authTransition === "stretching" ? "is-stretching" : ""
          } ${showChatStage ? "chat-card" : ""} ${isHandoff ? "is-handoff" : ""} ${
            dashboardEntering ? "dashboard-entering" : ""
          }`}
          aria-label={showChatStage ? "Atlas chat" : "Atlas login"}
        >
          <h1>Atlas</h1>

          <div className="login-stage">
            {!showChatStage ? (
              <>
                {error && !isLoginTransitioning && <div className="error-box">{error}</div>}

                <form
                  onSubmit={handleLogin}
                  className={`login-form ${isLoginTransitioning ? "login-form-exit" : ""}`}
                  aria-hidden={isLoginTransitioning}
                >
                  <label>
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setPassword("");
                        setError("");
                      }}
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </label>

                  <label className={`password-row ${showPasswordField ? "password-row-visible" : ""}`}>
                    Password
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required={showPasswordField}
                      tabIndex={showPasswordField ? 0 : -1}
                    />
                  </label>

                  <div className={`button-row ${showPasswordField ? "button-row-visible" : ""}`}>
                    <button
                      ref={authButtonRef}
                      className={`auth-button ${isLoginTransitioning ? "auth-button-active" : ""} ${
                        authTransition === "stretching" ? "auth-button-stretch" : ""
                      }`}
                      type="submit"
                      disabled={loading || isLoginTransitioning || !password.trim()}
                      tabIndex={showPasswordField ? 0 : -1}
                    >
                      <span className="auth-button-text">{buttonText}</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="chat-stage">
                <div className="chat-pills" aria-label="System status">
                  <span>API: {health?.status || "checking"}</span>
                  <span>DB: {health?.database || "checking"}</span>
                  <span>Route: {atlasStatus?.protected_route || "loading"}</span>
                </div>

                {error && <div className="error-box">{error}</div>}

                <div className="chat-window">
                  <div className="chat-thread" ref={chatThreadRef}>
                    {chatMessages.map((message, index) => (
                      <Fragment key={`${message.role}-${index}`}>
                        <div
                          className={`chat-message ${
                            message.role === "user" ? "user-message" : "atlas-message"
                          }`}
                        >
                          <span className="message-author">
                            {message.role === "atlas" && <MiniAtlasMark />}
                            <span className="message-author-name">{message.role === "user" ? "You" : "Atlas"}</span>
                          </span>
                          <p>{message.text}</p>
                        </div>
                        {!chatLoading && index === lastAtlasMessageIndex && suggestions}
                      </Fragment>
                    ))}

                    {!chatLoading && lastAtlasMessageIndex === -1 && suggestions}

                    {chatLoading && (
                      <div className="chat-message atlas-message">
                        <span className="message-author">
                          <MiniAtlasMark active />
                          <span className="message-author-name">Atlas</span>
                        </span>
                        <p>Thinking...</p>
                      </div>
                    )}
                  </div>
                </div>

                {atlasStatus && (
                  <div className="protected-proof">
                    GET /api/atlas/status verified
                  </div>
                )}

                <form className="chat-composer" ref={chatComposerRef} onSubmit={handleChatSubmit}>
                  <input
                    ref={chatInputRef}
                    aria-label="Message Atlas"
                    placeholder="How can I help you today?"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    autoComplete="off"
                  />
                  <button type="submit" disabled={!chatInput.trim() || chatLoading}>
                    Send
                  </button>
                </form>

                <button className="logout-button" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      {authMorph && (
        <div
          className={`auth-morph auth-morph-${authMorph.phase}`}
          style={{
            left: authMorph.phase === "measuring" ? authMorph.source.left : authMorph.target?.left ?? authMorph.source.left,
            top: authMorph.phase === "measuring" ? authMorph.source.top : authMorph.target?.top ?? authMorph.source.top,
            width:
              authMorph.phase === "measuring" ? authMorph.source.width : authMorph.target?.width ?? authMorph.source.width,
            height:
              authMorph.phase === "measuring" ? authMorph.source.height : authMorph.target?.height ?? authMorph.source.height,
          }}
          aria-hidden="true"
        >
          <span className="auth-morph-label">{buttonText.replace("|", "")}</span>
          <span className="auth-morph-composer-content">
            <span className="auth-morph-placeholder">How can I help you today?</span>
            <span className="auth-morph-send">Send</span>
          </span>
        </div>
      )}
    </>
  );
}

export default App;
