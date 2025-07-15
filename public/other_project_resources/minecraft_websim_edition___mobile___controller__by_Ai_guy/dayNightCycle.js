import * as THREE from 'three';

export const dayNightCycle = {
    dayDuration: 15 * 60, // 15 minutes in seconds
    nightDuration: 12 * 60, // 12 minutes in seconds
    get totalDuration() { return this.dayDuration + this.nightDuration; },
    transitionDuration: 120 // 2 minutes sunrise/sunset transition (increased from 60)
};

let stars = [];
let starsGroup;
let moon;
let sun;
let sky;

export function initDayNightCycle(scene) {
    createSky(scene);
    createStars(scene);
    createMoon(scene);
    createSun(scene);
    return {
        stars,
        moon,
        sun,
        sky
    };
}

function createSky(scene) {
    const skyGeo = new THREE.SphereGeometry(450, 32, 15);

    const skyMat = new THREE.ShaderMaterial({
        uniforms: {
            topColor: { value: new THREE.Color(0x000000) },
            bottomColor: { value: new THREE.Color(0x000000) },
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vWorldPosition = position;
                vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
                gl_Position.z = gl_Position.w;
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), 0.4), 0.0)), 1.0);
            }
        `,
        side: THREE.BackSide,
        fog: false
    });

    sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
}

export function createStars(scene) {
    starsGroup = new THREE.Group();
    scene.add(starsGroup);

    const starMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.6,
        transparent: true,
        opacity: 0,
        sizeAttenuation: false,
        depthWrite: false,
        fog: false // Ensure stars aren't affected by fog
    });

    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];

    for (let i = 0; i < 1000; i++) {
        const theta = Math.random() * Math.PI * 2; 
        const phi = Math.random() * Math.PI * 0.5;
        const radius = 500 + Math.random() * 100; 

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        starPositions.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starPoints = new THREE.Points(starsGeometry, starMaterial);
    starsGroup.add(starPoints);

    stars.push(starMaterial);
}

export function createMoon(scene) {
    const moonTexture = new THREE.TextureLoader().load('moon.png');
    moonTexture.magFilter = THREE.NearestFilter;
    moonTexture.minFilter = THREE.NearestFilter;

    const moonGeometry = new THREE.PlaneGeometry(45, 45);
    const moonMaterial = new THREE.MeshBasicMaterial({
        map: moonTexture,
        opacity: 0,
        transparent: true,
        fog: false // Ensure moon isn't affected by fog
    });

    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    scene.add(moon);
}

export function createSun(scene) {
    const sunTexture = new THREE.TextureLoader().load('sun.png');
    sunTexture.magFilter = THREE.NearestFilter;
    sunTexture.minFilter = THREE.NearestFilter;

    const sunGeometry = new THREE.PlaneGeometry(60, 60);
    const sunMaterial = new THREE.MeshBasicMaterial({
        map: sunTexture,
        opacity: 0,
        transparent: true,
        fog: false // Ensure sun isn't affected by fog
    });

    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
}

export function updateStarsPosition(camera) {
    if (!starsGroup || !camera) return;
    
    const playerPos = camera.position.clone();
    starsGroup.position.x = playerPos.x;
    starsGroup.position.z = playerPos.z;
}

export function updateShadowPosition(camera, directionalLight, sunTarget) {
    if (!directionalLight || !camera || !sunTarget) return;

    const pos = camera.position.clone();

    sunTarget.position.set(pos.x, 0, pos.z);
    sunTarget.updateMatrixWorld();
}

function smoothTransition(t) {
    // Smooth step function for more natural transitions
    return t * t * (3 - 2 * t);
}

export function updateDayNightCycle(deltaTime, gameTime, scene, camera, directionalLight, sunTarget, ambientLight, hemisphereLight) {
    gameTime += deltaTime;
    
    const cycleTime = gameTime % dayNightCycle.totalDuration;
    const timeOfDay = cycleTime / dayNightCycle.totalDuration; // 0 to 1
    
    const isDay = cycleTime < dayNightCycle.dayDuration;
    
    const sunriseStart = dayNightCycle.nightDuration - dayNightCycle.transitionDuration / 2;
    const sunriseEnd = dayNightCycle.nightDuration + dayNightCycle.transitionDuration / 2;
    const sunsetStart = dayNightCycle.dayDuration - dayNightCycle.transitionDuration / 2;
    const sunsetEnd = dayNightCycle.dayDuration + dayNightCycle.transitionDuration / 2;
    
    let transitionFactor = 0;
    
    if (cycleTime > sunriseStart && cycleTime < sunriseEnd) {
        const rawFactor = (cycleTime - sunriseStart) / dayNightCycle.transitionDuration;
        transitionFactor = smoothTransition(rawFactor);
    } else if (cycleTime > sunsetStart && cycleTime < sunsetEnd) {
        const rawFactor = 1 - (cycleTime - sunsetStart) / dayNightCycle.transitionDuration;
        transitionFactor = smoothTransition(rawFactor);
    } else if (isDay) {
        transitionFactor = 1;
    } else {
        transitionFactor = 0;
    }
    
    if (sky) {
        const dayTopColor = new THREE.Color(0x87CEEB);
        const dayBottomColor = new THREE.Color(0xF0F8FF);
        const nightTopColor = new THREE.Color(0x000010);
        const nightBottomColor = new THREE.Color(0x0a0a2a);

        const currentTop = nightTopColor.clone().lerp(dayTopColor, transitionFactor);
        const currentBottom = nightBottomColor.clone().lerp(dayBottomColor, transitionFactor);

        sky.material.uniforms.topColor.value.copy(currentTop);
        sky.material.uniforms.bottomColor.value.copy(currentBottom);
        sky.position.copy(camera.position);
    }
    
    if (scene.fog) {
        // Create darker fog for night
        const dayFogColor = new THREE.Color(0xF0F8FF);
        const nightFogColor = new THREE.Color(0x0a0a2a);
        const fogColor = nightFogColor.clone().lerp(dayFogColor, transitionFactor);
        
        scene.fog.color.copy(fogColor);
        
        // Adjust fog density based on time of day
        if (scene.fog.isFog) {
            // Linear fog - adjust near/far
            const nightFarMultiplier = 0.6; // Reduce visibility at night
            const farAdjustment = 1 - (1-transitionFactor) * (1-nightFarMultiplier);
            
            scene.fog.far = scene.fog._baseFar * farAdjustment;
        } else {
            // Exponential fog - adjust density
            const nightDensityMultiplier = 2.0; // Increase density at night
            const densityAdjustment = 1 + (1-transitionFactor) * (nightDensityMultiplier-1);
            
            scene.fog.density = scene.fog._baseDensity * densityAdjustment;
        }
    }
    
    // Improved light intensity transitions - made lighting generally brighter
    directionalLight.intensity = Math.max(0.2, 0.2 + transitionFactor * 1.0);
    
    // Adjust shadow settings based on time of day
    if (directionalLight.shadow) {
        if (!isDay || transitionFactor < 0.3) {
            // Night shadow settings - softer, less harsh shadows
            directionalLight.shadow.bias = -0.00025;
            directionalLight.shadow.normalBias = 0.05;
            directionalLight.shadow.radius = 1.5;
        } else {
            // Day shadow settings - more defined shadows
            directionalLight.shadow.bias = -0.0005;
            directionalLight.shadow.normalBias = 0.03;
            directionalLight.shadow.radius = 1;
        }
    }
    
    // Adjust ambient lighting for a brighter scene
    ambientLight.intensity = 0.4 + transitionFactor * 0.3;
    hemisphereLight.intensity = 0.3 + transitionFactor * 0.4;
    
    stars.forEach(starMaterial => {
        starMaterial.opacity = Math.max(0, 0.8 - transitionFactor * 0.8);
    });
    
    if (moon) {
        const moonAngle = (timeOfDay * Math.PI * 2) + Math.PI;
        const moonRadius = 400; 
        const moonX = camera.position.x + Math.cos(moonAngle) * moonRadius;
        const moonY = 100 * Math.sin(moonAngle);
        const moonZ = camera.position.z + Math.sin(moonAngle) * moonRadius;
        
        moon.position.set(moonX, Math.max(10, moonY), moonZ);
        
        moon.material.opacity = Math.max(0, 0.7 - transitionFactor * 0.7);
        moon.lookAt(camera.position);
    }
    
    if (sun) {
        const sunAngle = timeOfDay * Math.PI * 2;
        const sunRadius = 400;
        
        const sunX = camera.position.x + Math.cos(sunAngle) * sunRadius;
        const sunY = 100 * Math.sin(sunAngle);
        const sunZ = camera.position.z + Math.sin(sunAngle) * sunRadius;
        
        sun.position.set(sunX, Math.max(10, sunY), sunZ);
        sun.material.opacity = transitionFactor;
        sun.lookAt(camera.position);
    }
    
    const sunAngle = timeOfDay * Math.PI * 2;
    const sunRadius = 400; 
    const sunX = camera.position.x + Math.cos(sunAngle) * sunRadius;
    const sunY = 100 * Math.sin(sunAngle);
    const sunZ = camera.position.z + Math.sin(sunAngle) * sunRadius;
    
    directionalLight.position.set(sunX, Math.max(10, sunY), sunZ);
    
    return gameTime;
}