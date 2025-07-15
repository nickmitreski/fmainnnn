import * as THREE from 'three';

export class BlockParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.textureLoader = new THREE.TextureLoader();
        this.textures = {};
        this.camera = null;
    }
    
    setCamera(camera) {
        this.camera = camera;
    }
    
    createBlockParticles(blockType, position, count = 4, sizeMultiplier = 1.0) {
        for (let i = 0; i < count; i++) {
            this.createParticle(blockType, position, sizeMultiplier);
        }
    }
    
    createParticle(blockType, position, sizeMultiplier = 1.0) {
        const texturePath = this.getTexturePathForBlock(blockType);
        if (!texturePath) return null;
        
        let texture;
        if (this.textures[texturePath]) {
            texture = this.textures[texturePath];
        } else {
            texture = this.textureLoader.load(texturePath);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            this.textures[texturePath] = texture;
        }
        
        // Make particles 10% smaller
        const baseSize = (0.1 + Math.random() * 0.15) * 0.9;
        const size = baseSize * sizeMultiplier;
        const geometry = new THREE.PlaneGeometry(size, size);
        
        const segmentX = Math.floor(Math.random() * 2) * 0.5;
        const segmentY = Math.floor(Math.random() * 2) * 0.5;
        
        const uvs = geometry.attributes.uv;
        for (let i = 0; i < uvs.count; i++) {
            const u = uvs.getX(i) * 0.5 + segmentX;
            const v = uvs.getY(i) * 0.5 + segmentY;
            uvs.setXY(i, u, v);
        }
        uvs.needsUpdate = true;
        
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.1,
            color: 0xaaaaaa // Slightly darker color tint
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            position.x + 0.5 + (Math.random() - 0.5) * 0.5,
            position.y + 0.5 + (Math.random() - 0.5) * 0.5,
            position.z + 0.5 + (Math.random() - 0.5) * 0.5
        );
        
        mesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        const particle = {
            mesh,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2.5,
                // Reduced vertical velocity to make particles go less high
                Math.random() * 2.0 + 1.5, 
                (Math.random() - 0.5) * 2.5
            ),
            gravity: -9.8,
            lifetime: 0,
            maxLifetime: 1.2 + Math.random() * 0.8,
            rotation: new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8
            )
        };
        
        this.scene.add(mesh);
        this.particles.push(particle);
        
        return particle;
    }
    
    getTexturePathForBlock(blockType) {
        switch(blockType) {
            case 'grass': return 'grass_side.png';
            case 'dirt': return 'dirt.png';
            case 'stone': return 'stone.png';
            case 'smoothstone': return 'smoothstone.png';
            case 'cobble': return 'cobbles.png';
            case 'wood': return 'logside.png';
            case 'birchwood': return 'birchlogside.png';
            case 'leaves': return 'leaves.png';
            case 'birchleaves': return 'birchleaves.png';
            case 'plank': return 'plank.png';
            case 'birchplank': return 'birchplank.png';
            case 'craftingtable': return 'CFSIDE.png';
            case 'oakdoor': return 'door.png';
            case 'birchdoor': return 'birchdoor.png';
            case 'sand': return 'sand.png';
            case 'sandstone': return 'sandstone.png';
            case 'cacti': return 'cacti.png';
            case 'furnace': return 'furnaceside.png';
            case 'glass': return 'glass.png';
            case 'snow': return 'snow.png';
            case 'chest': return 'chestfront.png';
            case 'farmland': return 'farmland.png';
            case 'tall_grass': return 'grass.png';
            case 'oakslab': return 'plank.png';
            case 'birchslab': return 'birchplank.png';
            case 'seeds': return 'seeds.png';
            case 'haybale': return 'haybaletopbottom.png';
            case 'wheat': return 'wheat.png';
            case 'sprucewood': return 'sprucelog.png';
            case 'spruceleaves': return 'spruceleafs.png';
            case 'spruceplank': return 'spruceplank.png';
            case 'spruceslab': return 'spruceplank.png'; // Added spruce slab particles
            case 'sprucesapling': return 'sprucesapling.png'; // Added spruce sapling particles
            case 'deadbush': return 'deadbush.png';
            default:
                try {
                    const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
                    const customBlock = customBlocks.find(block => block.id === blockType);
                    if (customBlock && customBlock.textures) {
                        return customBlock.textures.front || Object.values(customBlock.textures)[0];
                    }
                } catch (error) {
                    console.error('Error getting custom block texture:', error);
                }
                return 'dirt.png';
        }
    }
    
    update(delta) {
        if (!this.camera) return;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.lifetime += delta;
            if (particle.lifetime > particle.maxLifetime) {
                this.scene.remove(particle.mesh);
                particle.mesh.geometry.dispose();
                particle.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            
            particle.velocity.y += particle.gravity * delta;
            
            particle.mesh.position.x += particle.velocity.x * delta;
            particle.mesh.position.y += particle.velocity.y * delta;
            particle.mesh.position.z += particle.velocity.z * delta;
            
            // Make particles face the camera
            particle.mesh.lookAt(this.camera.position);
            
            // Add slight rotation for visual interest
            particle.mesh.rotation.z += particle.rotation.z * delta * 0.2;
            
            const alpha = 1 - (particle.lifetime / particle.maxLifetime);
            particle.mesh.material.opacity = alpha;
        }
    }
}