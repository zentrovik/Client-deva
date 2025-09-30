// Main JavaScript file for Deva Portfolio

// Global variables
let scene, camera, renderer, controls, mixer, model;
let clock = new THREE.Clock();
let loadingManager, loadingOverlay, loadingProgress;
let animatedText = document.getElementById('animated-text');
let cursorGlow = document.querySelector('.cursor-glow');
let modelContainer = document.getElementById('model-container');
let isModelLoaded = false;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initCursorEffect();
    initTextAnimation();
    initThreeJS();
    initLoadingManager();
    loadModel();
    animate();
    handleResize();
});

// Initialize custom cursor effect
function initCursorEffect() {
    const cursorGlow = document.querySelector('.cursor-glow');
    
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.opacity = '1';
        
        // Use requestAnimationFrame for smoother movement
        requestAnimationFrame(() => {
            cursorGlow.style.left = `${e.clientX}px`;
            cursorGlow.style.top = `${e.clientY}px`;
        });
        
        // Check if cursor is over interactive elements
        const target = e.target;
        if (target.tagName === 'A' || target.tagName === 'BUTTON' || 
            target.classList.contains('social-icon') || 
            target.parentElement.classList.contains('social-icon')) {
            cursorGlow.style.width = '45px';
            cursorGlow.style.height = '45px';
            cursorGlow.style.backgroundColor = 'rgba(180, 41, 204, 0.8)';
            cursorGlow.style.mixBlendMode = 'screen';
        } else {
            cursorGlow.style.width = '35px';
            cursorGlow.style.height = '35px';
            cursorGlow.style.backgroundColor = '';
            cursorGlow.style.mixBlendMode = 'screen';
        }
    });

    document.addEventListener('mouseleave', () => {
        cursorGlow.style.opacity = '0';
    });

    // Disable on touch devices
    if ('ontouchstart' in window) {
        cursorGlow.style.display = 'none';
    }
}

// Initialize text animation for the tagline
function initTextAnimation() {
    const phrases = [
        "Full Stack Developer",
        "UI/UX Designer",
        "3D Enthusiast",
        "Problem Solver"
    ];
    
    let currentPhraseIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    function typeText() {
        const currentPhrase = phrases[currentPhraseIndex];
        
        if (isDeleting) {
            // Deleting text
            animatedText.textContent = currentPhrase.substring(0, currentCharIndex - 1);
            currentCharIndex--;
            typingSpeed = 50;
        } else {
            // Typing text
            animatedText.textContent = currentPhrase.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            typingSpeed = 100;
        }
        
        // Check if word is complete
        if (!isDeleting && currentCharIndex === currentPhrase.length) {
            // Pause at the end of typing
            isDeleting = true;
            typingSpeed = 1500;
        } else if (isDeleting && currentCharIndex === 0) {
            // Move to next phrase
            isDeleting = false;
            currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
            typingSpeed = 500;
        }
        
        setTimeout(typeText, typingSpeed);
    }
    
    // Start the typing animation
    setTimeout(typeText, 1000);
}

// Initialize Three.js scene
function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        45,
        modelContainer.clientWidth / modelContainer.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 5);
    
    // Create renderer with better quality settings
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    modelContainer.appendChild(renderer.domElement);
    
    // Add enhanced lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased intensity
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increased intensity
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);
    
    // Add colored rim light for better definition
    const rimLight = new THREE.PointLight(0x9c27b0, 2, 10);
    rimLight.position.set(-5, 2, -3);
    scene.add(rimLight);
    
    // Add fill light from front
    const fillLight = new THREE.PointLight(0x3f51b5, 1, 15);
    fillLight.position.set(0, 0, 8);
    scene.add(fillLight);
    
    // Add orbit controls with auto-rotation disabled
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7; // Increased for better control
    controls.enableZoom = true; // Enable zoom for better examination
    controls.zoomSpeed = 0.5; // Gentle zoom speed
    controls.minDistance = 3; // Prevent zooming too close
    controls.maxDistance = 10; // Prevent zooming too far
    controls.enablePan = false; // Disable panning for simplicity
    controls.autoRotate = false; // Auto-rotation disabled as requested
    controls.autoRotateSpeed = 0; // Set to 0 since auto-rotation is disabled
}

// Initialize loading manager
function initLoadingManager() {
    // Create loading overlay
    loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    
    const loadingText = document.createElement('div');
    loadingText.className = 'loading-text';
    loadingText.textContent = 'Loading 3D Model';
    
    loadingProgress = document.createElement('div');
    loadingProgress.className = 'loading-progress';
    loadingProgress.textContent = '0%';
    
    loadingOverlay.appendChild(loadingSpinner);
    loadingOverlay.appendChild(loadingText);
    loadingOverlay.appendChild(loadingProgress);
    modelContainer.appendChild(loadingOverlay);
    
    // Set up loading manager
    loadingManager = new THREE.LoadingManager();
    
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        const progress = Math.round((itemsLoaded / itemsTotal) * 100);
        loadingProgress.textContent = `${progress}%`;
    };
    
    loadingManager.onLoad = () => {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.remove();
            }, 500);
            isModelLoaded = true;
            
            // Add a subtle rotation to show the model better initially
            if (model) {
                // Rotate to a good viewing angle
                model.rotation.y = Math.PI / 4;
            }
        }, 1000);
    };
    
    loadingManager.onError = (url) => {
        console.error('Error loading 3D model:', url);
        loadingText.textContent = 'Error loading model';
        loadingSpinner.style.borderTopColor = '#ff0000';
    };
}

// Load the 3D model
function loadModel() {
    const loader = new THREE.GLTFLoader(loadingManager);
    
    loader.load(
        // Model path - update this to your actual model path
        '3d/stylized_sci-fi_worker__accessories_animated.glb',
        
        // onLoad callback
        (gltf) => {
            model = gltf.scene;
            
            // Scale and position the model for better visibility
            model.scale.set(1.8, 1.8, 1.8); // Increased scale
            model.position.set(0, -0.8, 0); // Adjusted position
            
            // Cast and receive shadows
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    // Improve material quality for better visibility
                    if (node.material) {
                        // Clone the material to avoid affecting other instances
                        node.material = node.material.clone();
                        
                        // Enhance material properties
                        node.material.metalness = 0.7;
                        node.material.roughness = 0.3;
                        node.material.envMapIntensity = 1.5;
                        
                        // Add emissive glow to certain materials if they have specific properties
                        if (node.material.name.includes('light') || 
                            node.material.name.includes('glow') || 
                            node.material.name.includes('emit')) {
                            node.material.emissive = new THREE.Color(0x9c27b0);
                            node.material.emissiveIntensity = 0.5;
                        }
                    }
                }
            });
            
            scene.add(model);
            
            // Handle animations if present
            if (gltf.animations && gltf.animations.length) {
                mixer = new THREE.AnimationMixer(model);
                
                // Play all animations
                gltf.animations.forEach((clip) => {
                    const action = mixer.clipAction(clip);
                    action.play();
                });
            }
            
            // Adjust camera and controls for best view
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraDistance = maxDim / (2 * Math.tan(fov / 2));
            
            // Add some padding but keep it closer for better visibility
            cameraDistance *= 1.1;
            
            // Position camera for optimal viewing angle
            camera.position.set(
                center.x + cameraDistance * 0.5, 
                center.y + cameraDistance * 0.3, 
                center.z + cameraDistance * 0.8
            );
            camera.lookAt(center);
            
            // Update controls target
            controls.target.copy(center);
            controls.update();
            
            // Add a subtle rotation to show the model better initially
            model.rotation.y = Math.PI / 4;
        },
        
        // onProgress callback
        (xhr) => {
            const progress = Math.round((xhr.loaded / xhr.total) * 100);
            console.log(`Loading model: ${progress}%`);
        },
        
        // onError callback
        (error) => {
            console.error('Error loading model:', error);
        }
    );
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Update animations
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }
    
    // No auto-rotation as requested
    // The model will only move when user interacts with it
    
    // Render scene
    renderer.render(scene, camera);
}

// Handle window resize
function handleResize() {
    window.addEventListener('resize', () => {
        // Update camera
        camera.aspect = modelContainer.clientWidth / modelContainer.clientHeight;
        camera.updateProjectionMatrix();
        
        // Update renderer
        renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
    });
}

// Handle visibility change to pause animations when tab is not active
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clock.stop();
    } else {
        clock.start();
    }
});

// Add interaction for model container to make it more intuitive
modelContainer.addEventListener('mouseenter', () => {
    document.body.style.cursor = 'grab';
});

modelContainer.addEventListener('mouseleave', () => {
    document.body.style.cursor = 'default';
});

modelContainer.addEventListener('mousedown', () => {
    document.body.style.cursor = 'grabbing';
});

modelContainer.addEventListener('mouseup', () => {
    document.body.style.cursor = 'grab';
});

// Add double-click to reset view
modelContainer.addEventListener('dblclick', () => {
    if (model) {
        // Reset camera position
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = maxDim / (2 * Math.tan(fov / 2));
        cameraDistance *= 1.1;
        
        // Animate camera position reset
        const startPosition = camera.position.clone();
        const endPosition = new THREE.Vector3(
            center.x + cameraDistance * 0.5,
            center.y + cameraDistance * 0.3,
            center.z + cameraDistance * 0.8
        );
        
        const startTime = Date.now();
        const duration = 1000; // 1 second animation
        
        function animateReset() {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease in-out function
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;
            
            camera.position.lerpVectors(startPosition, endPosition, easeProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animateReset);
            }
        }
        
        animateReset();
        
        // Reset controls target
        controls.target.copy(center);
        controls.update();
    }
});

// Add accessibility features
function checkReducedMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (mixer) {
            mixer.timeScale = 0.1; // Slow down animations instead of stopping them completely
        }
    }
}

// Check for reduced motion preference
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', checkReducedMotion);
checkReducedMotion();

// Add touch controls for mobile devices
function initTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    
    modelContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchMoved = false;
    }, { passive: true });
    
    modelContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            touchMoved = true;
        }
    }, { passive: true });
    
    modelContainer.addEventListener('touchend', (e) => {
        // Detect tap (for mobile users to reset view)
        if (!touchMoved && e.changedTouches.length === 1) {
            // Double tap detection (simplified)
            const now = Date.now();
            if (modelContainer.lastTapTime && (now - modelContainer.lastTapTime < 300)) {
                // Double tap detected - reset view
                if (model) {
                    // Reset camera position
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const fov = camera.fov * (Math.PI / 180);
                    let cameraDistance = maxDim / (2 * Math.tan(fov / 2));
                    cameraDistance *= 1.1;
                    
                    // Set camera position immediately for mobile (no animation)
                    camera.position.set(
                        center.x + cameraDistance * 0.5, 
                        center.y + cameraDistance * 0.3, 
                        center.z + cameraDistance * 0.8
                    );
                    camera.lookAt(center);
                    
                    // Update controls target
                    controls.target.copy(center);
                    controls.update();
                }
                modelContainer.lastTapTime = 0; // Reset
            } else {
                modelContainer.lastTapTime = now;
            }
        }
    }, { passive: true });
}

// Initialize touch controls
initTouchControls();

// Add environment map for better reflections
function addEnvironmentMap() {
    // Create a simple environment map
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    cubeRenderTarget.texture.type = THREE.HalfFloatType;
    
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    
    // Create a simple environment
    const envScene = new THREE.Scene();
    
    // Add gradient background
    const topColor = new THREE.Color(0x220033);
    const bottomColor = new THREE.Color(0x000033);
    
    const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    const fragmentShader = `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
            float h = normalize(vWorldPosition).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
        }
    `;
    
    const uniforms = {
        topColor: { value: topColor },
        bottomColor: { value: bottomColor }
    };
    
    const skyMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(
        new THREE.SphereGeometry(100, 32, 32),
        skyMaterial
    );
    envScene.add(sky);
    
    // Add some lights to the environment
    const envLight1 = new THREE.DirectionalLight(0xffffff, 1);
    envLight1.position.set(1, 1, 1);
    envScene.add(envLight1);
    
    const envLight2 = new THREE.DirectionalLight(0x9c27b0, 1);
    envLight2.position.set(-1, 1, -1);
    envScene.add(envLight2);
    
    // Render environment map
    cubeCamera.update(renderer, envScene);
    
    // Apply environment map to all materials
    scene.environment = cubeRenderTarget.texture;
}

// Call environment map function after scene is set up
setTimeout(addEnvironmentMap, 100);

// Add a helper function to check if the device is mobile
function isMobileDevice() {
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768)
    );
}

// Optimize for mobile devices
if (isMobileDevice()) {
    // Reduce quality for better performance on mobile
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
    
    // Adjust model scale for better visibility on small screens
    if (model) {
        model.scale.set(2.0, 2.0, 2.0);
    }
}

// Add a small info tooltip for desktop users
if (!isMobileDevice()) {
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.bottom = '10px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.fontSize = '12px';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.3s';
    tooltip.textContent = 'Drag to rotate • Scroll to zoom • Double-click to reset';
    
    modelContainer.appendChild(tooltip);
    
    modelContainer.addEventListener('mouseenter', () => {
        tooltip.style.opacity = '1';
        setTimeout(() => {
            tooltip.style.opacity = '0';
        }, 3000);
    });
}

// Add a fallback for browsers that don't support WebGL
function checkWebGLSupport() {
    if (!window.WebGLRenderingContext) {
        const errorMessage = document.createElement('div');
        errorMessage.style.position = 'absolute';
        errorMessage.style.top = '50%';
        errorMessage.style.left = '50%';
        errorMessage.style.transform = 'translate(-50%, -50%)';
        errorMessage.style.color = 'white';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.width = '80%';
        errorMessage.innerHTML = `
            <h3>WebGL Not Supported</h3>
            <p>Your browser or device doesn't support WebGL, which is required to display 3D content.</p>
            <p>Please try a different browser or device.</p>
        `;
        
        modelContainer.appendChild(errorMessage);
        return false;
    }
    return true;
}

// Check WebGL support
if (!checkWebGLSupport()) {
    console.error('WebGL not supported');
}

