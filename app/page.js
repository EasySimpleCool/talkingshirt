import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Talking Shirt</h1>
        <p>Welcome to the interactive shirt customization experience!</p>
      </header>
      <main className={styles.main}>
        {/* Main content will go here */}
      </main>
    </div>
  )
} 