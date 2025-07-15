import * as THREE from 'three';
import { calculateBreakTime, getBlockCategory, BLOCK_CATEGORIES } from './pickaxes.js';
import { soundManager } from './utils.js';

export class BlockBreaker {
    constructor(player, voxelWorld) {
        this.player = player;
        this.voxelWorld = voxelWorld;
        
        this.blockBreakProgress = 0;
        this.blockBreakTimer = 0;
        this.lastBreakPosition = null;

        this.particleSpawnTimer = 0;
        this.particleSpawnInterval = 0.2;
        
        // Create the break progress UI if it doesn't exist
        this.initializeBreakProgressUI();
    }
    
    initializeBreakProgressUI() {
        if (!document.getElementById('break-progress')) {
            const gameContainer = document.getElementById('game-container');
            const breakProgressBar = document.createElement('div');
            breakProgressBar.id = 'break-progress';
            breakProgressBar.className = 'break-progress';
            gameContainer.appendChild(breakProgressBar);
        }
    }
    
    startBreakingBlock(targetBlock, isCreative) {
        if (!targetBlock) return;
        
        const { x, y, z } = targetBlock.position;
        this.lastBreakPosition = { x, y, z };
        
        const blockType = this.voxelWorld.getBlock(x, y, z);
        if (!blockType) return;
        
        // In structure creation mode, prevent breaking the base grass layer
        if (this.voxelWorld.isStructureCreationMode && y <= 0) {
            if (this.voxelWorld.getBlock(x,y,z) === 'grass') {
                this.cancelBlockBreaking();
                return;
            }
        }
        
        // Prevent bedrock from being broken
        if (blockType === 'bedrock') {
            this.cancelBlockBreaking();
            return;
        }
        
        this.blockBreakProgress = 0;
        this.blockBreakTimer = this.getBlockBreakTime(blockType, isCreative);
    }
    
    cancelBlockBreaking() {
        this.blockBreakProgress = 0;
        this.lastBreakPosition = null;
        
        const progressBar = document.getElementById('break-progress');
        if (progressBar) {
            progressBar.style.display = 'none';
            progressBar.className = 'break-progress';
        }
    }
    
    playBreakSound(blockType) {
        if (!blockType) return;

        if (blockType === 'glass' || blockType === 'newglass') {
            soundManager.play('glass_break', { volume: 0.5 });
            return;
        }
        if (blockType === 'sand') {
            soundManager.play('sand_break', { volume: 0.5 });
            return;
        }
        
        const blockCategory = getBlockCategory(blockType);
        
        if (blockCategory === 'wood') {
            soundManager.play('wood_break', { volume: 0.5 });
        } else if (blockCategory === 'rock') {
            soundManager.play('stone_break', { volume: 0.5 });
        } else if (blockType.includes('grass')) {
            soundManager.play('grass_break', { volume: 0.5 });
        } else if (blockType === 'wool') {
            soundManager.play('wool_break', { volume: 0.5 });
        }
    }
    
    continueBreakingBlock(deltaTime, targetBlock, camera, isCreative) {
        if (!this.lastBreakPosition || !targetBlock) {
            this.cancelBlockBreaking();
            return null;
        }
        
        const { x, y, z } = targetBlock.position;
        if (x !== this.lastBreakPosition.x || 
            y !== this.lastBreakPosition.y || 
            z !== this.lastBreakPosition.z) {
            this.cancelBlockBreaking();
            return null;
        }
        
        this.blockBreakProgress += deltaTime / this.blockBreakTimer;
        
        if (!isCreative) {
            this.particleSpawnTimer += deltaTime;
            if (this.particleSpawnTimer >= this.particleSpawnInterval) {
                this.particleSpawnTimer = 0;
    
                const blockType = this.voxelWorld.getBlock(this.lastBreakPosition.x, this.lastBreakPosition.y, this.lastBreakPosition.z);
                if (this.player.particleSystem && blockType) {
                    this.player.particleSystem.createBlockParticles(blockType, this.lastBreakPosition, 1, 0.5);
                }
            }
        }
        
        if (this.blockBreakProgress >= 1) {
            const { x, y, z } = targetBlock.position;
            const blockType = this.voxelWorld.getBlock(x, y, z);
            
            this.playBreakSound(blockType);
            
            // Check for special block types that don't drop items
            if (blockType && 
                (blockType === 'glass' || blockType === 'newglass')) {
                this.voxelWorld.breakBlock(x, y, z);
                this.cancelBlockBreaking();
                return null;
            }
            
            // Check if block is rock type and requires pickaxe
            const selectedItem = this.player.inventory.getSelectedItem();
            const toolType = selectedItem && selectedItem.type;
            const category = getBlockCategory(blockType);
            
            if (category === 'rock' && toolType !== 'woodpickaxe' && toolType !== 'stonepickaxe') {
                this.voxelWorld.breakBlock(x, y, z);
                this.cancelBlockBreaking();
                return null;
            }
            
            const brokenBlockType = this.voxelWorld.breakBlock(x, y, z);
            this.cancelBlockBreaking();
            return brokenBlockType;
        }
        
        const progressBar = document.getElementById('break-progress');
        if (progressBar) {
            progressBar.style.display = 'block';
            
            const elapsedTime = (this.blockBreakProgress * this.blockBreakTimer).toFixed(1);
            const totalTime = this.blockBreakTimer.toFixed(1);
            
            progressBar.innerHTML = `<span class="break-time">${elapsedTime}s/${totalTime}s</span>`;
            
            if (targetBlock) {
                const worldPos = new THREE.Vector3(
                    targetBlock.position.x + 0.5,
                    targetBlock.position.y + 0.5,
                    targetBlock.position.z + 0.5
                );
                
                const screenPos = worldPos.project(camera);
                progressBar.style.left = `${(screenPos.x + 1) * 50}%`;
                progressBar.style.top = `${(-screenPos.y + 1) * 50}%`;
            }
        }
        
        return null;
    }
    
    getBlockBreakTime(blockType, isCreative) {
        if (isCreative) return 0;
        
        const selectedItem = this.player.inventory.getSelectedItem();
        const toolType = selectedItem && selectedItem.type;
        
        return calculateBreakTime(blockType, toolType);
    }
    
    isBreakingBlock() {
        return this.lastBreakPosition !== null;
    }
    
    getProgress() {
        return this.blockBreakProgress;
    }
}