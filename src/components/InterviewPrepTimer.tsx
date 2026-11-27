import { useEffect, useState } from "react";
import type { Application } from "../types/index.ts";

const QUESTION_SECONDS = 120;

const QUESTIONS: string[] = [
  "Ceritakan tentang diri Anda dan mengapa tertarik magang di bidang IT.",
  "Jelaskan perbedaan antara state dan props pada React.",
  "Apa itu REST API dan bagaimana cara Anda memanggilnya dari frontend?",
  "Ceritakan proyek teknis terbaik yang pernah Anda kerjakan dan peran Anda di dalamnya.",
  "Bagaimana Anda men-debug bug yang tidak diketahui penyebabnya?",
  "Jelaskan perbedaan Git merge dan rebase.",
  "Apa yang Anda lakukan saat menemui tugas yang belum Anda kuasai?",
];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface InterviewPrepTimerProps {
  application: Application;
}

export function InterviewPrepTimer({ application }: InterviewPrepTimerProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  // Interval hanya dibuat saat isRunning=true. Cleanup menghentikan interval ketika
  // pause/reset/unmount (panel ditutup), sehingga tidak ada interval ganda saat dibuka lagi.
  useEffect(() => {
    if (!isRunning) return;
    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning]);

  // Berhenti otomatis saat waktu habis (derived dari secondsLeft)
  useEffect(() => {
    if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
    }
  }, [isRunning, secondsLeft]);

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(QUESTION_SECONDS);
  };

  const handleNext = () => {
    setQuestionIndex((prev) => (prev + 1) % QUESTIONS.length);
    setIsRunning(false);
    setSecondsLeft(QUESTION_SECONDS);
  };

  const timeUp = secondsLeft === 0;
  const progressPercent = Math.round((secondsLeft / QUESTION_SECONDS) * 100);

  return (
    <div className="prep-timer">
      <p className="form-help-text">
        Latihan untuk <strong>{application.role}</strong> di <strong>{application.company}</strong>
      </p>

      <div className="prep-question-card">
        <span className="prep-question-count">
          Soal {questionIndex + 1} dari {QUESTIONS.length}
        </span>
        <p className="prep-question-text">{QUESTIONS[questionIndex]}</p>
      </div>

      <div
        className={`prep-clock ${timeUp ? "prep-clock-over" : secondsLeft <= 15 ? "prep-clock-warn" : ""}`}
        role="timer"
        aria-live="off"
      >
        {formatTime(secondsLeft)}
      </div>
      <div className="progress-bar-track" aria-hidden="true">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      {timeUp && <p className="form-error-text">⏰ Waktu habis! Lanjut ke soal berikutnya.</p>}

      <div className="prep-controls">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setIsRunning((prev) => !prev)}
          disabled={timeUp}
        >
          {isRunning ? "⏸ Pause" : secondsLeft === QUESTION_SECONDS ? "▶ Start" : "▶ Lanjutkan"}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={handleReset}>
          ↺ Reset
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleNext}>
          Soal Berikutnya ➜
        </button>
      </div>
    </div>
  );
}