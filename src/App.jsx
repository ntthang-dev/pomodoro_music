import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Maximize2, Minimize2, X, Plus, Music, Minus, ListTodo, Download, CloudRain, Coffee, Wind, FolderOpen, PlusCircle, Trash2, Activity } from 'lucide-react';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rain', icon: <CloudRain size={16}/>, url: 'ambient/rain.mp3' },
  { id: 'noise', name: 'White Noise', icon: <Wind size={16}/>, url: 'ambient/noise.mp3' },
  { id: 'cafe', name: 'Cafe', icon: <Coffee size={16}/>, url: 'ambient/cafe.mp3' }
];

export default function App() {
  const [theme, setTheme] = useState('default');
  const [isMini, setIsMini] = useState(false);
  
  // Timer State
  const [mode, setMode] = useState('focus'); // focus, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  // Media State
  const [library, setLibrary] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ytLink, setYtLink] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const audioRef = useRef(new Audio());
  
  // Ambient State
  const [activeAmbient, setActiveAmbient] = useState(null);
  const ambientAudioRef = useRef(new Audio());
  const [volume, setVolume] = useState(0.5);

  // Visualizer Refs
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const [visStyle, setVisStyle] = useState('aurora'); // 'aurora', 'halo', 'particles'
  const visStyleRef = useRef(visStyle);

  useEffect(() => {
    visStyleRef.current = visStyle;
  }, [visStyle]);

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load Library
  const loadLibrary = async () => {
    if (window.electronAPI) {
      const files = await window.electronAPI.getLibrary();
      setLibrary(files);
    }
  };

  useEffect(() => {
    loadLibrary();
    ambientAudioRef.current.loop = true;
    ambientAudioRef.current.volume = volume * 0.5; // Ambient is slightly softer
    audioRef.current.volume = volume;
  }, []);

  // Update volume when slider changes
  useEffect(() => {
    audioRef.current.volume = volume;
    ambientAudioRef.current.volume = volume * 0.5;
  }, [volume]);

  // Audio Visualizer Setup
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      try {
        // Connect both main audio and ambient audio to the same visualizer
        const source1 = audioContextRef.current.createMediaElementSource(audioRef.current);
        const source2 = audioContextRef.current.createMediaElementSource(ambientAudioRef.current);
        
        source1.connect(analyserRef.current);
        source2.connect(analyserRef.current);
        
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        console.log("Audio node already connected");
      }
    }

    // Initialize particles state for 'particles' mode
    let particles = [];
    for (let i = 0; i < 64; i++) {
      particles.push({
        x: Math.random() * 300, // max canvas width
        y: 60, // canvas height
        vy: 0,
        baseSize: Math.random() * 2 + 1,
        colorIndex: i
      });
    }

    const drawVisualizer = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const style = visStyleRef.current;
      
      // Global glowing blend mode
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      
      if (style === 'bars') {
        analyserRef.current.getByteFrequencyData(dataArray);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        ctx.globalCompositeOperation = 'source-over'; // No extreme glow for simple bars
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2;
          ctx.fillStyle = `rgba(255, 255, 255, ${barHeight / 150})`;
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, barWidth - 1, barHeight, [4, 4, 0, 0]);
          ctx.fill();
          x += barWidth;
        }
      } else if (style === 'aurora') {
        analyserRef.current.getByteTimeDomainData(dataArray);
        
        ctx.beginPath();
        const sliceWidth = canvas.width / (bufferLength - 1);
        let x = 0;
        
        // Use bezier curve for smooth Aurora wave
        ctx.moveTo(0, canvas.height / 2);
        
        for (let i = 0; i < bufferLength - 1; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * canvas.height / 2;
          
          const nextV = dataArray[i+1] / 128.0;
          const nextY = nextV * canvas.height / 2;
          
          const cpX = x + sliceWidth / 2;
          
          ctx.bezierCurveTo(cpX, y, cpX, nextY, x + sliceWidth, nextY);
          x += sliceWidth;
        }
        
        // Fluid Neon Glow
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0ff'; // Cyan glow
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        
        // Fill underneath with dynamic gradient
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0.4)'); // Deep Purple
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)'); // Neon Cyan
        gradient.addColorStop(1, 'rgba(255, 105, 180, 0.4)'); // Pastel Pink
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 0; // Remove shadow for fill
        ctx.fill();

      } else if (style === 'halo') {
        analyserRef.current.getByteFrequencyData(dataArray);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Calculate average bass frequency (lower bins)
        let bassSum = 0;
        for(let i = 0; i < 10; i++) bassSum += dataArray[i];
        const bassAvg = bassSum / 10;
        
        const pulse = bassAvg / 255; // 0 to 1
        const radius = 15 + (pulse * 10);
        
        // Outer glowing distortion
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + (pulse * 5), 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(217, 70, 239, ${0.2 + pulse * 0.5})`; // Accent color glow
        ctx.lineWidth = 4 + (pulse * 6);
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#d946ef';
        ctx.stroke();
        
        // Inner sharp ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.stroke();
        
        ctx.shadowBlur = 0; // Reset
        
      } else if (style === 'particles') {
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // We have 64 particles, match them roughly to the first 64 freq bins
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const freq = dataArray[i] || 0;
          
          // Jump height based on frequency
          const targetY = canvas.height - (freq / 255) * canvas.height;
          
          // Smoothly move particle towards target Y (easing)
          p.y += (targetY - p.y) * 0.2;
          
          // Calculate color based on frequency band
          // Low freq (bass) = warm pinks, High freq = cool blues
          const hue = 300 - (i / particles.length) * 100; // 300 is pink/magenta, 200 is blue/cyan
          const lightness = 40 + (freq / 255) * 40;
          
          // Size pulses with frequency
          const size = p.baseSize + (freq / 255) * 3;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 100%, ${lightness}%, ${0.5 + (freq/255)*0.5})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
      
      animationRef.current = requestAnimationFrame(drawVisualizer);
    };

    drawVisualizer();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, activeAmbient]);

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            setIsActive(false);
            // Play alarm sound safely
            try {
              new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
              new Notification("Timer Complete", {
                body: mode === 'focus' ? 'Time for a break!' : 'Time to focus!',
              });
            } catch (e) {
              console.log('Audio/Notification error:', e);
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    if (newMode === 'focus') setTimeLeft(25 * 60);
    if (newMode === 'shortBreak') setTimeLeft(5 * 60);
    if (newMode === 'longBreak') setTimeLeft(15 * 60);
  };

  const toggleTimer = () => setIsActive(!isActive);

  // Media Logic
  const playTrack = async (track) => {
    setCurrentTrack(track);
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    if (window.electronAPI) {
      const dataUri = await window.electronAPI.readAudioFile(track.path);
      if (dataUri) {
        audioRef.current.src = dataUri;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Ambient Logic
  const toggleAmbient = async (sound) => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    if (activeAmbient === sound.id) {
      ambientAudioRef.current.pause();
      setActiveAmbient(null);
    } else {
      ambientAudioRef.current.src = sound.url; // In production, replace with local file paths
      ambientAudioRef.current.play();
      setActiveAmbient(sound.id);
      
      // Smart theme update: switch to vibe, but user can still override
      if (sound.id === 'rain') setTheme('rain');
      else if (sound.id === 'cafe') setTheme('cafe');
      else if (sound.id === 'noise') setTheme('noise');
    }
  };

  const handleDownloadYoutube = async () => {
    if (!ytLink || !window.electronAPI) return;
    setIsDownloading(true);
    const res = await window.electronAPI.downloadYoutube(ytLink);
    setIsDownloading(false);
    setYtLink('');
    if (res.success) {
      loadLibrary();
    } else {
      alert("Download failed: " + res.error);
    }
  };

  const handleRename = async (e, track) => {
    e.stopPropagation(); // prevent playing track
    const newName = window.prompt("Enter new name for the track:", track.name.replace(/\.[^/.]+$/, ""));
    if (newName && newName.trim() !== "") {
      if (window.electronAPI) {
        const res = await window.electronAPI.renameTrack(track.path, newName.trim());
        if (res.success) {
          loadLibrary();
        } else {
          alert("Rename failed: " + res.error);
        }
      }
    }
  };

  const handleDelete = async (e, track) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${track.name}?`)) {
      if (window.electronAPI) {
        const res = await window.electronAPI.deleteTrack(track.path);
        if (res.success) {
          if (currentTrack && currentTrack.path === track.path) {
            audioRef.current.pause();
            setCurrentTrack(null);
            setIsPlaying(false);
          }
          loadLibrary();
        } else {
          alert("Delete failed: " + res.error);
        }
      }
    }
  };

  const handleOpenLibrary = async () => {
    if (window.electronAPI) {
      await window.electronAPI.openLibraryFolder();
    }
  };

  const handleAddTracks = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.addTracks();
      if (res && res.success) {
        loadLibrary();
      } else if (res && !res.canceled) {
        alert("Failed to add tracks: " + res.error);
      }
    }
  };

  // Task Logic
  const handleTaskKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!newTask.trim()) return;
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Window Controls
  const handleWinMinimize = () => {
    if (window.electronAPI) window.electronAPI.windowMinimize();
  };
  
  const handleWinMaximize = () => {
    if (window.electronAPI) window.electronAPI.windowMaximize();
  };
  
  const handleWinClose = () => {
    if (window.electronAPI) window.electronAPI.windowClose();
  };

  const toggleMiniPlayer = () => {
    const nextState = !isMini;
    setIsMini(nextState);
    if (window.electronAPI) window.electronAPI.toggleAlwaysOnTop(nextState);
  };

  return (
    <>
      <div className="titlebar">
        <div className="window-controls">
          <button className="control-btn min-btn" onClick={handleWinMinimize} title="Minimize">
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <button className="control-btn max-btn" onClick={handleWinMaximize} title="Maximize">
            <Maximize2 size={12} strokeWidth={2.5} />
          </button>
          <button className="control-btn close-btn" onClick={handleWinClose} title="Close">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className={`app-container ${isMini ? 'mini' : ''}`}>
        {!isMini && (
          <div className="top-bar">
            <div className="theme-selector glass-panel" style={{ padding: '8px 12px', borderRadius: '100px' }}>
              <div className={`theme-dot ${theme === 'default' ? 'active' : ''}`} data-theme="default" onClick={() => setTheme('default')} title="Deep Purple"></div>
              <div className={`theme-dot ${theme === 'cafe' ? 'active' : ''}`} data-theme="cafe" onClick={() => setTheme('cafe')} title="Warm Brown"></div>
              <div className={`theme-dot ${theme === 'rain' ? 'active' : ''}`} data-theme="rain" onClick={() => setTheme('rain')} title="Moody Blue"></div>
              <div className={`theme-dot ${theme === 'noise' ? 'active' : ''}`} data-theme="noise" onClick={() => setTheme('noise')} title="Minimalist Gray"></div>
            </div>
            <button className="action-btn" onClick={toggleMiniPlayer} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              <Minimize2 size={16} /> Mini Player
            </button>
          </div>
        )}

        {isMini && (
           <div className="top-bar">
             <span style={{fontWeight: 600}}>Mini Mode</span>
             <button className="action-btn" onClick={toggleMiniPlayer} style={{ padding: '4px 8px' }}>
              <Maximize2 size={16} />
            </button>
           </div>
        )}

        <div className={`main-content ${isMini ? 'mini' : ''}`}>
          
          {/* TIMER SECTION */}
          <div className="timer-section glass-panel">
            {!isMini && (
              <div className="timer-modes">
                <button className={`mode-btn ${mode === 'focus' ? 'active' : ''}`} onClick={() => switchMode('focus')}>Focus</button>
                <button className={`mode-btn ${mode === 'shortBreak' ? 'active' : ''}`} onClick={() => switchMode('shortBreak')}>Short Break</button>
                <button className={`mode-btn ${mode === 'longBreak' ? 'active' : ''}`} onClick={() => switchMode('longBreak')}>Long Break</button>
              </div>
            )}
            
            <div className="timer-display">
              {formatTime(timeLeft)}
            </div>
            
            <button className="action-btn" onClick={toggleTimer}>
              {isActive ? <Pause /> : <Play />}
              {isActive ? 'Pause' : 'Start'}
            </button>
          </div>

          {/* MEDIA & AMBIENT SECTION */}
          {!isMini && (
            <div className="player-section glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Music size={20}/> Offline Audio Library</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleAddTracks} className="control-icon" style={{background: 'none', border: 'none', color: 'inherit'}} title="Add Music">
                    <PlusCircle size={18} />
                  </button>
                  <button onClick={handleOpenLibrary} className="control-icon" style={{background: 'none', border: 'none', color: 'inherit'}} title="Open Library Folder">
                    <FolderOpen size={18} />
                  </button>
                </div>
              </div>
              
              <div className="yt-input-container">
                <input 
                  type="text" 
                  className="yt-input" 
                  placeholder="Paste YouTube Link to save offline..."
                  value={ytLink}
                  onChange={e => setYtLink(e.target.value)}
                />
                <button className="yt-btn" onClick={handleDownloadYoutube} disabled={isDownloading || !ytLink}>
                  {isDownloading ? 'Saving...' : <Download size={20}/>}
                </button>
              </div>

              <div className="library-list">
                {library.length === 0 ? (
                  <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px'}}>No offline audio. Paste a YouTube link above!</p>
                ) : (
                  library.map((track, idx) => (
                    <div 
                      key={idx} 
                      className={`track-item ${currentTrack?.name === track.name ? 'active' : ''}`}
                      onClick={() => playTrack(track)}
                      style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                    >
                      <div style={{display: 'flex', alignItems: 'center', overflow: 'hidden'}}>
                        <Music size={16} style={{marginRight: '12px', opacity: 0.5, flexShrink: 0}}/>
                        <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{track.name.replace(/\.[^/.]+$/, "")}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={(e) => handleRename(e, track)} 
                          className="mode-btn" 
                          style={{padding: '4px 8px', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--glass-border)'}}
                          title="Rename"
                        >
                          Rename
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, track)} 
                          className="mode-btn" 
                          style={{padding: '4px 8px', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--glass-border)', color: '#ef4444'}}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="player-controls">
                <SkipBack className="control-icon" size={24} />
                <div className="play-btn control-icon" onClick={togglePlay}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} style={{marginLeft: '4px'}} />}
                </div>
                <SkipForward className="control-icon" size={24} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Vol</span>
                <input 
                  type="range" 
                  min="0" max="1" step="0.01" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
              </div>

              <div className="visualizer-container" style={{ position: 'relative', height: '60px', width: '100%', marginTop: '8px' }}>
                <canvas ref={canvasRef} width="300" height="60" style={{ width: '100%', height: '100%' }}></canvas>
                <button 
                  onClick={() => setVisStyle(v => v === 'aurora' ? 'halo' : v === 'halo' ? 'particles' : v === 'particles' ? 'bars' : 'aurora')}
                  className="control-icon"
                  style={{ position: 'absolute', right: '0', top: '0', background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px' }}
                  title="Change Visualizer Style"
                >
                  <Activity size={14} />
                </button>
              </div>

              {currentTrack && (
                <div style={{textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>
                  Playing: {currentTrack.name.replace(/\.[^/.]+$/, "")}
                </div>
              )}

              {/* Ambient Sounds */}
              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Ambient Sounds</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {AMBIENT_SOUNDS.map(sound => (
                    <button 
                      key={sound.id}
                      onClick={() => toggleAmbient(sound)}
                      className="mode-btn"
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem',
                        background: activeAmbient === sound.id ? 'var(--accent)' : 'var(--glass-bg)',
                        color: activeAmbient === sound.id ? '#fff' : 'var(--text-primary)'
                      }}
                    >
                      {sound.icon} {sound.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TASKS SECTION */}
          {!isMini && (
            <div className="tasks-section glass-panel">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ListTodo size={20}/> Tasks</h3>
              <input 
                type="text" 
                className="task-input" 
                placeholder="What are you focusing on? (Press Enter)"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={handleTaskKeyDown}
              />
              <div className="task-list">
                {tasks.map(task => (
                  <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`} style={{display: 'flex', justifyContent: 'space-between'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden'}}>
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={() => toggleTask(task.id)}
                        style={{cursor: 'pointer', flexShrink: 0}}
                      />
                      <span style={{textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}}>{task.text}</span>
                    </div>
                    <X size={14} style={{cursor: 'pointer', opacity: 0.5}} onClick={() => deleteTask(task.id)} className="control-icon" />
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p style={{color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginTop: '20px'}}>No tasks yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
