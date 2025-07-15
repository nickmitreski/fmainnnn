export class SimplexNoise {
    constructor(seed = 1337) {
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }
        
        let seedRandom = this.seededRandom(seed);
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(seedRandom() * (i + 1));
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }
        
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }
    
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
    
    noise2D(x, y) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        
        const G2 = (3 - Math.sqrt(3)) / 6;
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        
        let i1, j1;
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } else {
            i1 = 0;
            j1 = 1;
        }
        
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.permMod12[ii + this.perm[jj]];
        const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
        const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
        
        let n0 = 0, n1 = 0, n2 = 0;
        
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            t0 *= t0;
            n0 = t0 * t0 * this.gradP(gi0, x0, y0);
        }
        
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            t1 *= t1;
            n1 = t1 * t1 * this.gradP(gi1, x1, y1);
        }
        
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            t2 *= t2;
            n2 = t2 * t2 * this.gradP(gi2, x2, y2);
        }
        
        return 70 * (n0 + n1 + n2);
    }
    
    gradP(hash, x, y) {
        const grad3 = [
            [1, 1], [-1, 1], [1, -1], [-1, -1],
            [1, 0], [-1, 0], [1, 0], [-1, 0],
            [0, 1], [0, -1], [0, 1], [0, -1]
        ];
        const g = grad3[hash];
        return g[0] * x + g[1] * y;
    }
}

// --- New Sound Engine ---
let audioContext;
const audioBuffers = new Map();

function getAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Web Audio API is not supported in this browser');
            audioContext = null;
        }
    }
    return audioContext;
}

async function loadSound(url) {
    if (audioBuffers.has(url)) {
        return audioBuffers.get(url);
    }
    const context = getAudioContext();
    if (!context) return null;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        audioBuffers.set(url, audioBuffer);
        return audioBuffer;
    } catch (error) {
        console.error(`Error loading sound from ${url}:`, error);
        return null;
    }
}

function playSoundFromBuffer(buffer, volume = 1.0, playbackRate = 1.0) {
    const context = getAudioContext();
    if (!buffer || !context) return;

    if (context.state === 'suspended') {
        context.resume().then(() => {
            const source = context.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = playbackRate;

            const gainNode = context.createGain();
            gainNode.gain.setValueAtTime(volume, context.currentTime);

            source.connect(gainNode);
            gainNode.connect(context.destination);
            source.start(0);
        });
        return;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;

    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(volume, context.currentTime);

    source.connect(gainNode);
    gainNode.connect(context.destination);
    source.start(0);
}

export const soundManager = {
    _sounds: new Map(),
    _loopingSounds: new Map(),
    _contextInitialized: false,

    init() {
        if (this._contextInitialized) return;
        const initAudio = () => {
            if (this._contextInitialized) return;
            const context = getAudioContext();
            if (context && context.state === 'suspended') {
                context.resume();
            }
            this._contextInitialized = true;
        };
        document.addEventListener('mousedown', initAudio, { once: true });
        document.addEventListener('keydown', initAudio, { once: true });
    },

    async preload(name, url) {
        const buffer = await loadSound(url);
        if (buffer) {
            this._sounds.set(name, buffer);
        }
    },

    play(name, options = {}) {
        const { volume = 1.0, playbackRate = 1.0 } = options;
        const buffer = this._sounds.get(name);
        if (buffer) {
            playSoundFromBuffer(buffer, volume, playbackRate);
        } else {
            console.warn(`Sound not preloaded or failed to load: ${name}`);
        }
    },

    playLoop(name, options = {}) {
        if (this._loopingSounds.has(name)) return;

        const { volume = 1.0, playbackRate = 1.0, loopDelay = 0 } = options;
        const buffer = this._sounds.get(name);
        if (!buffer) {
            console.warn(`Sound not preloaded or failed to load: ${name}`);
            return;
        }

        const context = getAudioContext();
        if (!context) return;
        
        if (context.state === 'suspended') {
            context.resume();
        }

        let soundData = {
            source: null,
            gainNode: null,
            timeoutId: null,
        };

        const play = () => {
            // If sound was stopped, don't play again.
            if (!this._loopingSounds.has(name)) {
                return;
            }

            const source = context.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = playbackRate;

            const gainNode = context.createGain();
            gainNode.gain.setValueAtTime(volume, context.currentTime);

            source.connect(gainNode);
            gainNode.connect(context.destination);
            source.start(0);

            soundData.source = source;
            soundData.gainNode = gainNode;
            this._loopingSounds.set(name, soundData);

            source.onended = () => {
                // Only loop if it wasn't manually stopped
                if (this._loopingSounds.has(name) && this._loopingSounds.get(name).source === source) {
                    soundData.source = null; // Mark as ended
                    soundData.timeoutId = setTimeout(play, loopDelay * 1000);
                }
            };
        };

        this._loopingSounds.set(name, soundData); // Set it first to indicate it's active
        play();
    },

    stopLoop(name, fadeOutDuration = 0) {
        if (!this._loopingSounds.has(name)) return;

        const soundData = this._loopingSounds.get(name);
        this._loopingSounds.delete(name); // Remove immediately to prevent re-scheduling
        
        if (soundData.timeoutId) {
            clearTimeout(soundData.timeoutId);
        }

        if (!soundData.source) { // It's in the timeout phase
            return;
        }

        const { source, gainNode } = soundData;
        const context = getAudioContext();

        if (fadeOutDuration > 0 && context) {
            try {
                // Fade out the gain. Ramping to a tiny value instead of 0 can prevent clicks.
                gainNode.gain.cancelScheduledValues(context.currentTime);
                gainNode.gain.setValueAtTime(gainNode.gain.value, context.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.0001, context.currentTime + fadeOutDuration);

                // Schedule the source to stop after the fade.
                source.stop(context.currentTime + fadeOutDuration);

                // Disconnect the node when it has finished playing.
                source.onended = () => {
                    source.disconnect();
                };

            } catch (e) {
                console.error("Error during sound fade out:", e);
                // Fallback to immediate stop if something goes wrong.
                source.stop();
                source.disconnect();
            }
        } else {
            // Stop immediately if no fade duration.
            source.stop();
            source.disconnect();
        }
    },

    stopAllLoops(fadeOutDuration = 0) {
        const loopingKeys = [...this._loopingSounds.keys()];
        loopingKeys.forEach(name => {
            this.stopLoop(name, fadeOutDuration);
        });
    }
};