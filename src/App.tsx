import './App.css'

function App() {

  return (
    <>
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">React · Vite · TypeScript · Fabric.js</p>
          <h1>Photo Text Editor</h1>
          <p className="subtitle">
            Базовый каркас для приложения, которое будет принимать фото,
            добавлять текст и сохранять результат в JPG.
          </p>
        </div>

        <button className="theme-button" type="button">
          Theme
        </button>
      </header>

      <main className="workspace">
        <aside className="panel panel-left">
          <section className="panel-section">
            <h2>Input</h2>
            <button className="primary-button" type="button">
              Upload image
            </button>
            <button className="secondary-button" type="button">
              Paste from clipboard
            </button>
          </section>

          <section className="panel-section">
            <h2>Text</h2>

            <label className="field">
              <span>Content</span>
              <input type="text" placeholder="Your text" />
            </label>

            <label className="field">
              <span>Font size</span>
              <input type="range" min="12" max="96" defaultValue="36" />
            </label>

            <label className="field">
              <span>Text color</span>
              <input type="color" defaultValue="#ffffff" />
            </label>
          </section>
        </aside>

        <section className="panel editor-stage" aria-label="Canvas area">
          <div className="canvas-placeholder">
            <p>Canvas area</p>
            <span>
              На следующем шаге сюда подключим Fabric canvas и загрузку
              изображения.
            </span>
          </div>
        </section>

        <aside className="panel panel-right">
          <section className="panel-section">
            <h2>Export</h2>
            <button className="primary-button" type="button">
              Save as JPG
            </button>
          </section>

          <section className="panel-section">
            <h2>Status</h2>
            <ul>
              <li>Vite + React + TypeScript настроены</li>
              <li>Fabric.js установлен</li>
              <li>GitHub Pages scripts готовы</li>
              <li>UI-каркас подготовлен</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
    </>
  )
}

export default App
