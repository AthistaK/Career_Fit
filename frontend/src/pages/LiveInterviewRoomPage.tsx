import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Maximize2,
  Minimize2,
  Send,
  AlertCircle,
  Radio,
  User,
  Edit3,
  X,
} from 'lucide-react';
import { AIInterviewerAvatar } from '../components/interview/AIInterviewerAvatar';
import { speechManager } from '../utils/speechManager';
import { liveInterviewService } from '../services/liveInterviewService';
import { LiveInterviewSession, AvatarState, InterviewState } from '../types/liveInterview';

export const LiveInterviewRoomPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionNum = Number(sessionId);

  const [session, setSession] = useState<LiveInterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exclusive single Interview State (Requirement 5)
  const [interviewState, setInterviewState] = useState<InterviewState>('Preparing');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [aiAudioLevel, setAiAudioLevel] = useState<number>(0);

  // Fullscreen state & prompt (Requirement 1)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' && Boolean(document.fullscreenElement);
  });
  const [showFullscreenBanner, setShowFullscreenBanner] = useState<boolean>(false);

  // Student Media Controls & Permissions (Requirement 2)
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Candidate Response State (The ONLY YOU Section - Requirement 3 & 4)
  const [liveTranscript, setLiveTranscript] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isTextMode, setIsTextMode] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [micVolume, setMicVolume] = useState<number>(0);

  // Timer & Recording
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Media & Recognition Refs
  const studentVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const answerSubmittedRef = useRef<boolean>(false);

  // Audio Context & Voice Detection Refs (Prevents Stale Closures & Cutoffs)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeIntervalRef = useRef<any>(null);
  const micVolumeRef = useRef<number>(0);
  const interviewStateRef = useRef<InterviewState>('Preparing');
  const micEnabledRef = useRef<boolean>(true);
  const isListeningActiveRef = useRef<boolean>(false);
  const finalTranscriptRef = useRef<string>('');

  // Keep state refs synchronized to eliminate stale closure bugs
  useEffect(() => {
    interviewStateRef.current = interviewState;
  }, [interviewState]);

  useEffect(() => {
    micEnabledRef.current = micEnabled;
  }, [micEnabled]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (active) {
        setShowFullscreenBanner(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // If starting and fullscreen was not activated, show a brief polite reminder banner
    const autoFullscreenAttempted = (location.state as any)?.autoFullscreenTriggered;
    if (!document.fullscreenElement && !autoFullscreenAttempted) {
      setShowFullscreenBanner(true);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [location.state]);

  // Load Session and initialize interview
  useEffect(() => {
    if (!sessionNum) {
      setError('Invalid interview session ID.');
      setLoading(false);
      return;
    }
    loadSession();

    return () => {
      cleanupMedia();
    };
  }, [sessionNum]);

  const cleanupMedia = () => {
    speechManager.cancel();
    isListeningActiveRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (e) {}
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
  };

  const loadSession = async () => {
    try {
      setLoading(false);
      const data = await liveInterviewService.getSession(sessionNum);
      setSession(data);
      setRemainingSeconds(data.duration_minutes * 60);

      // If session is already completed, redirect to review report
      if (data.status === 'completed') {
        navigate(`/live-interview/review/${data.id}`);
        return;
      }

      // Automatically turn on camera and microphone (Requirement 2)
      await initStudentMedia();

      // Start interview interaction sequence (Requirement 4)
      await startInterview(data);
    } catch (err: any) {
      console.error('Failed to load live interview session:', err);
      setError(err.response?.data?.detail || 'Failed to connect to the interview room.');
    }
  };

  // Automatically request and start camera and microphone with Web Audio input volume analyzer
  const initStudentMedia = async () => {
    try {
      setMediaError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Verify audio track status
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = true;
      }

      if (studentVideoRef.current) {
        studentVideoRef.current.srcObject = stream;
      }

      setCameraEnabled(true);
      setMicEnabled(true);
      micEnabledRef.current = true;

      // Connect Web Audio API to analyze microphone sensitivity & input volume
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.4;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
          volumeIntervalRef.current = setInterval(() => {
            if (!analyserRef.current || !micEnabledRef.current) {
              setMicVolume(0);
              micVolumeRef.current = 0;
              return;
            }
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const level = Math.min(100, Math.round((avg / 64) * 100));
            setMicVolume(level);
            micVolumeRef.current = level;
          }, 50);
        }
      } catch (audioErr) {
        console.warn('AudioContext volume analyzer setup notice:', audioErr);
      }

      // Initialize recorder for replay
      try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        recordedChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn('Video recorder could not start:', recErr);
      }
    } catch (err: any) {
      console.warn('Camera/Microphone permission status:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError('Camera or microphone permission was blocked. Please allow permissions in your browser URL bar.');
      } else {
        setMediaError('Could not access media devices. Continuing in text fallback mode.');
      }
      setCameraEnabled(false);
      setMicEnabled(false);
      micEnabledRef.current = false;
      setIsTextMode(true);
    }
  };

  // Start interview session: AI asks question (Step 1)
  const startInterview = async (sess: LiveInterviewSession) => {
    try {
      const res = await liveInterviewService.startSession(sess.id);
      setCurrentQuestion(res.first_question);

      const openingText = res.greeting ? `${res.greeting} ${res.first_question}` : res.first_question;
      askQuestionAndThenWait(openingText);
    } catch (err) {
      console.error('Failed to start interview:', err);
    }
  };

  // STEP 1 & STEP 2: AI speaks the question, then strictly WAITS for student's answer (Requirement 4)
  const askQuestionAndThenWait = (questionText: string) => {
    // Stop any existing mic recognition while AI is speaking (Prevents AI recording its own voice)
    stopListening();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    answerSubmittedRef.current = false;
    finalTranscriptRef.current = '';
    setLiveTranscript('');

    if (!speakerEnabled) {
      // If speaker is muted, immediately transition to waiting for student
      setInterviewState('Listening to You');
      startListening();
      return;
    }

    setInterviewState('AI Speaking');
    speechManager.speak(questionText, {
      onStart: () => {
        setInterviewState('AI Speaking');
      },
      onAudioPulse: (level) => {
        setAiAudioLevel(level);
      },
      onEnd: () => {
        // STEP 2: AI FINISHES SPEAKING -> TRANSITIONS TO LISTENING & WAITS
        setAiAudioLevel(0);
        setInterviewState('Listening to You');
        startListening();
      },
      onError: () => {
        setAiAudioLevel(0);
        setInterviewState('Listening to You');
        startListening();
      },
    });
  };

  // Speech-To-Text Candidate Engine (Step 3: Capture Answer & Silence Detection)
  const startListening = () => {
    if (!micEnabledRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsTextMode(true);
      return;
    }

    try {
      isListeningActiveRef.current = true;
      finalTranscriptRef.current = '';

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {};

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const cleaned = (finalTranscriptRef.current + ' ' + interim).trim();
        if (cleaned) {
          setLiveTranscript(cleaned);
        }

        // Silence detection: Do not mistake a short pause for a completed answer
        // If the candidate has spoken at least 4 words, start/reset silence timer
        const words = cleaned.split(/\s+/).filter(Boolean);
        if (words.length >= 4 && !answerSubmittedRef.current) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            // Auto-submit only if student is not actively uttering sound right now
            if (micVolumeRef.current >= 12) {
              return;
            }
            if (!answerSubmittedRef.current && cleaned.length >= 5) {
              handleAnswerSubmit(cleaned);
            }
          }, 3000);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setMicEnabled(false);
          micEnabledRef.current = false;
          setIsTextMode(true);
        } else if (e.error === 'no-speech') {
          // Harmless browser silence pause; recognition will continue via onend
        }
      };

      recognition.onend = () => {
        // Keep listening as long as interview is in 'Listening to You' state
        if (
          isListeningActiveRef.current &&
          interviewStateRef.current === 'Listening to You' &&
          micEnabledRef.current &&
          !answerSubmittedRef.current
        ) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition fallback:', e);
      setIsTextMode(true);
    }
  };

  const stopListening = () => {
    isListeningActiveRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // Timer Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // STEP 4: Submit & Evaluate Answer
  const handleAnswerSubmit = async (explicitAnswer?: string) => {
    if (answerSubmittedRef.current || isSubmittingAnswer) return;

    const candidateAnswer = explicitAnswer
      ? explicitAnswer.trim()
      : (isTextMode ? typedAnswer.trim() || liveTranscript.trim() : liveTranscript.trim() || typedAnswer.trim());

    // Never submit an empty or fabricated answer (Requirement 4)
    if (!candidateAnswer) return;

    answerSubmittedRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    stopListening();
    speechManager.cancel();

    // Exclusive state: Processing Answer (Requirement 5)
    setInterviewState('Processing Answer');
    setIsSubmittingAnswer(true);

    try {
      const nextTurnData = await liveInterviewService.submitTurn(sessionNum, {
        student_transcript: candidateAnswer,
        duration_seconds: 0,
        timestamp_seconds: elapsedSeconds,
      });

      // Clear recognized answer for the next turn
      setLiveTranscript('');
      setTypedAnswer('');

      if (nextTurnData.is_completed || !nextTurnData.next_question) {
        // STEP 6: Wrap up interview
        setInterviewState('Interview Completed');
        const wrapUpSpeech = `${nextTurnData.ai_reaction || 'Thank you for your response.'} That concludes our interview questions today! Let's generate your detailed evaluation report.`;
        speechManager.speak(wrapUpSpeech, {
          onEnd: () => handleFinishInterview(),
          onError: () => handleFinishInterview(),
        });
      } else {
        // STEP 5 & 6: Speak reaction and dynamically generated next question, then wait
        setCurrentQuestion(nextTurnData.next_question);
        const speechPrompt = `${nextTurnData.ai_reaction || ''} ${nextTurnData.next_question}`.trim();
        askQuestionAndThenWait(speechPrompt);
      }
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      setInterviewState('Listening to You');
      startListening();
    } finally {
      setIsSubmittingAnswer(false);
      answerSubmittedRef.current = false;
    }
  };

  // End Interview & Navigate to Review Report
  const handleFinishInterview = async () => {
    setShowEndModal(false);
    setIsFinalizing(true);
    cleanupMedia();

    try {
      await liveInterviewService.finishSession(sessionNum);

      if (mediaRecorderRef.current && recordedChunksRef.current.length > 0) {
        const fullBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        try {
          await liveInterviewService.uploadRecording(sessionNum, fullBlob, elapsedSeconds, true);
        } catch (uploadErr) {
          console.warn('Video upload notice:', uploadErr);
        }
      }

      navigate(`/live-interview/review/${sessionNum}`);
    } catch (err: any) {
      console.error('Failed to finalize interview:', err);
      navigate(`/live-interview/review/${sessionNum}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Toggle Video Camera
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = !cameraEnabled));
      setCameraEnabled(!cameraEnabled);
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = !micEnabled));
    }
    if (micEnabled) {
      stopListening();
    } else if (interviewState === 'Listening to You') {
      startListening();
    }
    setMicEnabled(!micEnabled);
  };

  // Toggle Fullscreen (Requirement 1)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Map InterviewState to AvatarState
  const getAvatarState = (): AvatarState => {
    switch (interviewState) {
      case 'AI Speaking':
        return 'speaking';
      case 'Listening to You':
        return 'listening';
      case 'Processing Answer':
        return 'thinking';
      case 'Interview Completed':
        return 'closing';
      case 'Preparing':
      default:
        return 'greeting';
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0B0A19] flex items-center justify-center text-[#F8FAFC]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center animate-pulse">
            <Radio className="w-6 h-6 text-[#A78BFA]" />
          </div>
          <p className="text-sm font-bold tracking-wide">Connecting to Live Interview Room...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-screen w-screen bg-[#0B0A19] flex items-center justify-center p-4 text-[#F8FAFC]">
        <div className="max-w-md w-full p-6 rounded-2xl bg-[#19162C] border border-[#2A2548] text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold">Unable to Join Interview</h2>
          <p className="text-xs text-[#A5A1BA]">{error || 'Session could not be loaded.'}</p>
          <button
            onClick={() => navigate('/live-interview')}
            className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold"
          >
            Back to AI Interview
          </button>
        </div>
      </div>
    );
  }

  const hasAnswerReady = liveTranscript.trim().length > 0 || typedAnswer.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen bg-[#0B0A19] text-[#F8FAFC] flex flex-col overflow-hidden select-none font-sans">
      {/* ========================================================
          OPTIONAL FULLSCREEN NOTIFICATION BANNER (Requirement 1)
      ======================================================== */}
      {showFullscreenBanner && !isFullscreen && (
        <div className="bg-[#19162C] border-b border-[#2A2548] px-4 py-2 flex items-center justify-between text-xs text-[#A5A1BA] z-40">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Click the fullscreen icon in the top right to expand this interview to full screen anytime.</span>
          </div>
          <button
            onClick={() => setShowFullscreenBanner(false)}
            className="p-1 text-[#A5A1BA] hover:text-[#F8FAFC]"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================
          TOP BAR (Requirement 3)
          LIVE INTERVIEW indicator | Job role and company | Timer | Fullscreen exit
      ======================================================== */}
      <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[#2A2548] bg-[#100E21]/95 backdrop-blur-md z-30 flex-shrink-0">
        {/* Left: LIVE INTERVIEW */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F8FAFC]">
              LIVE INTERVIEW
            </span>
          </div>

          <div className="hidden sm:block h-4 w-[1px] bg-[#2A2548]" />

          {/* Center / Role and Company */}
          <div className="min-w-0 truncate">
            <span className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate">
              {session.job_title}
            </span>
            {session.company && (
              <span className="text-xs text-[#A5A1BA] truncate ml-1.5 hidden md:inline">
                • {session.company}
              </span>
            )}
          </div>
        </div>

        {/* Right: Timer & Fullscreen Exit Control */}
        <div className="flex items-center gap-3">
          {/* Interview Timer */}
          <div className="px-3 py-1 rounded-xl bg-[#19162C] border border-[#2A2548] text-xs font-bold text-[#A78BFA] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          {/* Fullscreen Exit / Toggle Control */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-[#A5A1BA] hover:text-[#F8FAFC] hover:bg-[#211D38] transition-colors"
            title={isFullscreen ? 'Leave Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================
          MAIN AREA (Requirement 3)
          Large Centered AI Avatar | Small Candidate Preview on the Right
      ======================================================== */}
      <main className="flex-1 flex flex-col p-3 sm:p-5 gap-3 sm:gap-4 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col md:flex-row gap-3 sm:gap-4 min-h-0 relative">
          {/* Large, Centered AI Interviewer Avatar */}
          <div className="flex-1 w-full h-full rounded-2xl sm:rounded-3xl border border-[#2A2548] overflow-hidden bg-[#100E21] shadow-2xl relative flex items-center justify-center">
            <AIInterviewerAvatar
              state={getAvatarState()}
              interviewState={interviewState}
              audioLevel={aiAudioLevel}
            />
          </div>

          {/* Small Candidate Camera Preview on the Right (Requirement 2 & 3) */}
          <div className="w-full md:w-64 lg:w-72 h-36 md:h-full max-h-52 md:max-h-none rounded-2xl sm:rounded-3xl border border-[#2A2548] overflow-hidden bg-[#19162C] shadow-xl relative flex-shrink-0">
            <video
              ref={studentVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                cameraEnabled ? 'block' : 'hidden'
              }`}
            />

            {!cameraEnabled && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#141029] text-[#A5A1BA] p-3 text-center">
                <VideoOff className="w-6 h-6 text-[#8B5CF6] mb-1.5" />
                <p className="text-xs font-bold text-[#F8FAFC]">Camera Off</p>
                {mediaError && (
                  <p className="text-[10px] text-rose-300 mt-1 max-w-[200px] leading-tight">
                    {mediaError}
                  </p>
                )}
              </div>
            )}

            {/* Candidate Section Status Indicators (Requirement 2) */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] bg-[#0B0A19]/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#2A2548]/60">
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span className="font-bold text-[#F8FAFC] truncate">You</span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {cameraEnabled ? (
                  <span className="text-[10px] text-emerald-400 font-semibold">Camera On</span>
                ) : (
                  <span className="text-[10px] text-rose-400 font-semibold">Camera Off</span>
                )}
                <span className="text-[#2A2548]">•</span>
                {micEnabled ? (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <div className="flex items-end gap-0.5 h-2.5">
                      <span className={`w-0.5 rounded-full transition-all duration-75 ${micVolume > 4 ? 'bg-emerald-400 h-2.5' : 'bg-emerald-500/30 h-1'}`} />
                      <span className={`w-0.5 rounded-full transition-all duration-75 ${micVolume > 14 ? 'bg-emerald-400 h-2.5' : 'bg-emerald-500/30 h-1.5'}`} />
                      <span className={`w-0.5 rounded-full transition-all duration-75 ${micVolume > 26 ? 'bg-emerald-400 h-2.5' : 'bg-emerald-500/30 h-2'}`} />
                    </div>
                    <span>Mic On</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-rose-400 font-semibold">Muted</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            BOTTOM CONVERSATION AREA (EXACTLY TWO SECTIONS - Requirement 3)
            1. AI INTERVIEWER – Displays current question
            2. YOU – Displays candidate's recognized answer
        ======================================================== */}
        <section className="h-44 sm:h-48 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 flex-shrink-0">
          {/* ========================================================
              SECTION 1: AI INTERVIEWER
          ======================================================== */}
          <div className="rounded-2xl border border-[#2A2548] bg-[#100E21]/95 backdrop-blur-xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2548]/60">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#A78BFA]">
                AI INTERVIEWER
              </span>
              <span className="text-[11px] font-semibold text-[#A5A1BA]">
                {interviewState === 'AI Speaking' && <span className="text-[#A78BFA] animate-pulse">Speaking...</span>}
                {interviewState === 'Listening to You' && <span className="text-emerald-400">Waiting for your answer</span>}
                {interviewState === 'Processing Answer' && <span className="text-amber-300">Processing answer...</span>}
                {interviewState === 'Preparing' && <span>Preparing...</span>}
              </span>
            </div>

            {/* Current Question Typography */}
            <div className="flex-1 flex items-center py-2 overflow-y-auto">
              <p className="text-sm sm:text-base font-semibold text-[#F8FAFC] leading-relaxed select-text">
                {currentQuestion || 'Welcome! The interview is initializing...'}
              </p>
            </div>

            <div className="text-[11px] text-[#A5A1BA] pt-1 border-t border-[#2A2548]/40">
              Question {(session.current_question_index || 0) + 1}
            </div>
          </div>

          {/* ========================================================
              SECTION 2: YOU
          ======================================================== */}
          <div className="rounded-2xl border border-[#2A2548] bg-[#100E21]/95 backdrop-blur-xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2548]/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  YOU
                </span>
                {interviewState === 'Listening to You' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Listening
                  </span>
                )}
              </div>

              {/* Type mode fallback toggle */}
              <button
                onClick={() => setIsTextMode(!isTextMode)}
                className="flex items-center gap-1 text-[10px] font-semibold text-[#A5A1BA] hover:text-[#F8FAFC] transition-colors"
                title="Toggle manual text edit"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isTextMode ? 'Voice Mode' : 'Type Instead'}</span>
              </button>
            </div>

            {/* Candidate Recognized Answer */}
            <div className="flex-1 flex flex-col justify-center py-2 overflow-y-auto">
              {isTextMode ? (
                <input
                  type="text"
                  placeholder="Type your response here and press Enter..."
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                  disabled={interviewState !== 'Listening to You' && interviewState !== 'Preparing'}
                  className="w-full px-3 py-2 rounded-xl bg-[#19162C] border border-[#2A2548] text-xs sm:text-sm text-[#F8FAFC] placeholder-[#A5A1BA] focus:outline-none focus:border-[#8B5CF6]"
                  autoFocus
                />
              ) : (
                <div className="min-h-12 flex items-center">
                  {liveTranscript ? (
                    <p className="text-xs sm:text-sm text-emerald-200 font-medium leading-relaxed italic select-text">
                      "{liveTranscript}"
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-[#A5A1BA]/70 leading-relaxed italic">
                      {interviewState === 'AI Speaking'
                        ? 'Listening to question...'
                        : 'Listening for your response...'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Action Control */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#2A2548]/40">
              <span className="text-[11px] text-[#A5A1BA]">
                {hasAnswerReady ? 'Response captured' : 'Speak clearly into your microphone'}
              </span>

              {/* Manual Submit Answer Control (Requirement 4) */}
              <button
                onClick={() => handleAnswerSubmit()}
                disabled={isSubmittingAnswer || !hasAnswerReady}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Submit Answer</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================
          BOTTOM CONTROLS (Keep ONLY these 4 - Requirement 3)
          Microphone toggle | Camera toggle | Speaker toggle | End Interview button
      ======================================================== */}
      <footer className="h-20 px-6 border-t border-[#2A2548] bg-[#100E21]/95 backdrop-blur-md flex items-center justify-center z-30 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Microphone Toggle */}
          <button
            onClick={toggleMic}
            className={`p-3.5 rounded-2xl transition-all ${
              micEnabled
                ? 'bg-[#211D38] text-[#F8FAFC] hover:bg-[#2A2548]'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
            title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleCamera}
            className={`p-3.5 rounded-2xl transition-all ${
              cameraEnabled
                ? 'bg-[#211D38] text-[#F8FAFC] hover:bg-[#2A2548]'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
            title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {cameraEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Speaker Toggle */}
          <button
            onClick={() => {
              if (speakerEnabled) {
                speechManager.cancel();
              }
              setSpeakerEnabled(!speakerEnabled);
            }}
            className={`p-3.5 rounded-2xl transition-all ${
              speakerEnabled
                ? 'bg-[#211D38] text-[#F8FAFC] hover:bg-[#2A2548]'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
            title={speakerEnabled ? 'Mute Speaker' : 'Unmute Speaker'}
          >
            {speakerEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* End Interview Button */}
          <button
            onClick={() => setShowEndModal(true)}
            className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_18px_rgba(225,29,72,0.45)] transition-all flex items-center gap-2 px-5 font-bold text-xs"
            title="End Interview"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Interview</span>
          </button>
        </div>
      </footer>

      {/* ========================================================
          CONFIRMATION MODAL: End Interview Early
      ======================================================== */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0A19]/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#19162C] border border-[#2A2548] text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <PhoneOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#F8FAFC]">End Interview?</h3>
            <p className="text-xs text-[#A5A1BA] leading-relaxed">
              Are you sure you want to end this interview? Your answers will be analyzed and evaluated in a performance report.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 rounded-xl bg-[#211D38] hover:bg-[#2A2548] text-xs font-bold text-[#F8FAFC] transition-colors"
              >
                Continue Interview
              </button>
              <button
                onClick={handleFinishInterview}
                disabled={isFinalizing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-colors flex items-center gap-1.5"
              >
                {isFinalizing ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <span>End Interview</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
