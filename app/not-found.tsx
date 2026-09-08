import Link from "next/link";
export default function NotFound() {
  return (
    <main
      id="main-content"
      style={{ maxWidth: 520, margin: "15vh auto", padding: 24 }}
    >
      <h1>That page took a rest day.</h1>
      <p>The page you’re looking for isn’t available.</p>
      <Link href="/login">Back to coachOS</Link>
    </main>
  );
}
