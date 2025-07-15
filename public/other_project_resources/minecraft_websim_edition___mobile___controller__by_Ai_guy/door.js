import * as THREE from 'three';
import { soundManager } from './utils.js';

export class Door {
    constructor() {
        this.doorStates = new Map();
        this.doorOrientations = new Map();
        this.doorTypes = new Map();
        this.thickness = 0.2;
    }

    createDoorGeometry(geometry, x, y, z, isOpen, isLowerHalf) {
        const thickness = this.thickness;
        const doorHeight = 1.0;
        const doorWidth = 1.0;
        
        const cx = x + 0.5;
        const cy = y + 0.5;
        const cz = z + 0.5;
        
        const worldKey = `${x},${y},${z}`;
        const orientation = this.doorOrientations.get(worldKey) || 0;
        const doorType = this.doorTypes.get(worldKey) || 'oak';
        
        const isTopHalf = !isLowerHalf;

        let vertices = [];
        
        if (isOpen) {
            let nx, nz;
            
            switch(orientation) {
                case 0: nx = -1; nz = 0; break;
                case 1: nx = 0; nz = -1; break;
                case 2: nx = 1; nz = 0; break;
                case 3: nx = 0; nz = 1; break;
            }
            
            const targetX = x + 0.5 + nx * 0.5;
            const targetZ = z + 0.5 + nz * 0.5;
            
            const v1 = [targetX - doorWidth/2 * Math.abs(nz), cy - doorHeight/2, targetZ - doorWidth/2 * Math.abs(nx)];
            const v2 = [targetX + doorWidth/2 * Math.abs(nz), cy - doorHeight/2, targetZ + doorWidth/2 * Math.abs(nx)];
            const v3 = [targetX + doorWidth/2 * Math.abs(nz), cy + doorHeight/2, targetZ + doorWidth/2 * Math.abs(nx)];
            const v4 = [targetX - doorWidth/2 * Math.abs(nz), cy + doorHeight/2, targetZ - doorWidth/2 * Math.abs(nx)];
            
            const v5 = [targetX - doorWidth/2 * Math.abs(nz) - thickness * nx, cy - doorHeight/2, targetZ - doorWidth/2 * Math.abs(nx) - thickness * nz];
            const v6 = [targetX + doorWidth/2 * Math.abs(nz) - thickness * nx, cy - doorHeight/2, targetZ + doorWidth/2 * Math.abs(nx) - thickness * nz];
            const v7 = [targetX + doorWidth/2 * Math.abs(nz) - thickness * nx, cy + doorHeight/2, targetZ + doorWidth/2 * Math.abs(nx) - thickness * nz];
            const v8 = [targetX - doorWidth/2 * Math.abs(nz) - thickness * nx, cy + doorHeight/2, targetZ - doorWidth/2 * Math.abs(nx) - thickness * nz];
            
            vertices = [
                // Face 0: Front
                v1, v2, v3, v4,
                // Face 1: Back
                v5, v6, v7, v8,
                // Face 2: Top
                v4, v3, v7, v8,
                // Face 3: Bottom
                v1, v5, v6, v2,
                // Face 4: Right
                v2, v3, v7, v6,
                // Face 5: Left
                v1, v4, v8, v5
            ];
        } else {
            let doorX, doorZ, doorNormalX, doorNormalZ;
            
            switch(orientation) {
                case 0: doorX = cx; doorZ = cz + 0.4; doorNormalX = 0; doorNormalZ = 1; break;
                case 1: doorX = cx - 0.4; doorZ = cz; doorNormalX = -1; doorNormalZ = 0; break;
                case 2: doorX = cx; doorZ = cz - 0.4; doorNormalX = 0; doorNormalZ = -1; break;
                case 3: doorX = cx + 0.4; doorZ = cz; doorNormalX = 1; doorNormalZ = 0; break;
            }

            const v = [];
            // Vertices 0-3: Front Face corners
            v.push([doorX - doorWidth/2 * doorNormalZ, cy - doorHeight/2, doorZ - doorWidth/2 * doorNormalX]); // 0
            v.push([doorX + doorWidth/2 * doorNormalZ, cy - doorHeight/2, doorZ + doorWidth/2 * doorNormalX]); // 1
            v.push([doorX + doorWidth/2 * doorNormalZ, cy + doorHeight/2, doorZ + doorWidth/2 * doorNormalX]); // 2
            v.push([doorX - doorWidth/2 * doorNormalZ, cy + doorHeight/2, doorZ - doorWidth/2 * doorNormalX]); // 3
            // Vertices 4-7: Back Face corners
            v.push([doorX - doorWidth/2 * doorNormalZ + thickness * doorNormalX, cy - doorHeight/2, doorZ - doorWidth/2 * doorNormalX + thickness * doorNormalZ]); // 4
            v.push([doorX + doorWidth/2 * doorNormalZ + thickness * doorNormalX, cy - doorHeight/2, doorZ + doorWidth/2 * doorNormalX + thickness * doorNormalZ]); // 5
            v.push([doorX + doorWidth/2 * doorNormalZ + thickness * doorNormalX, cy + doorHeight/2, doorZ + doorWidth/2 * doorNormalX + thickness * doorNormalZ]); // 6
            v.push([doorX - doorWidth/2 * doorNormalZ + thickness * doorNormalX, cy + doorHeight/2, doorZ - doorWidth/2 * doorNormalX + thickness * doorNormalZ]); // 7

            vertices = [
                // Face 0: Front
                v[0], v[1], v[2], v[3],
                // Face 1: Back
                v[4], v[5], v[6], v[7],
                // Face 2: Top
                v[3], v[2], v[6], v[7],
                // Face 3: Bottom
                v[0], v[4], v[5], v[1],
                // Face 4: Right
                v[1], v[5], v[6], v[2],
                // Face 5: Left
                v[4], v[0], v[3], v[7]
            ];
        }
        
        for (let face = 0; face < 6; face++) {
            const faceVertices = vertices.slice(face * 4, (face + 1) * 4);
            
            const p0 = new THREE.Vector3().fromArray(faceVertices[0]);
            const p1 = new THREE.Vector3().fromArray(faceVertices[1]);
            const p2 = new THREE.Vector3().fromArray(faceVertices[2]);
            
            const v_ab = new THREE.Vector3().subVectors(p1, p0);
            const v_ac = new THREE.Vector3().subVectors(p2, p0);
            const faceNormal = new THREE.Vector3().crossVectors(v_ab, v_ac).normalize();
            
            const baseVertexIndex = geometry.vertexIndex;

            for (const vertex of faceVertices) {
                geometry.vertices.push(vertex[0], vertex[1], vertex[2]);
                geometry.normals.push(faceNormal.x, faceNormal.y, faceNormal.z);
            }
            
            if (face === 0 || face === 1) { // front and back
                const faceUVs = isTopHalf ? 
                    [0, 0.5, 1, 0.5, 1, 1, 0, 1] : 
                    [0, 0, 1, 0, 1, 0.5, 0, 0.5];
                geometry.uvs.push(...faceUVs);
            } else { // sides, top, bottom
                geometry.uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
            }
            
            geometry.indices.push(
                baseVertexIndex, baseVertexIndex + 1, baseVertexIndex + 2,
                baseVertexIndex, baseVertexIndex + 2, baseVertexIndex + 3
            );
            
            geometry.vertexIndex += 4;
        }
    }

    toggle(x, y, z, voxelWorld) {
        const worldKey = `${x},${y},${z}`;
        const currentState = this.doorStates.get(worldKey) || false;
        
        let bottomX = x;
        let bottomY = y;
        let bottomZ = z;
        
        const blockBelow = voxelWorld.getBlock(x, y-1, z);
        const blockAbove = voxelWorld.getBlock(x, y+1, z);
        
        if (blockBelow === 'oakdoor' || blockBelow === 'birchdoor') {
            bottomY = y-1;
        } else if (blockAbove === 'oakdoor' || blockAbove === 'birchdoor') {
        } else {
            return false;
        }
        
        const bottomWorldKey = `${bottomX},${bottomY},${bottomZ}`;
        this.doorStates.set(bottomWorldKey, !currentState);
        
        const topWorldKey = `${bottomX},${bottomY+1},${bottomZ}`;
        this.doorStates.set(topWorldKey, !currentState);
        
        if (!currentState) { // if was closed, now is open
            soundManager.play('door_open', { volume: 0.5 });
        }
        
        const chunkX = Math.floor(x / voxelWorld.chunkSize);
        const chunkZ = Math.floor(z / voxelWorld.chunkSize);
        voxelWorld.markChunkDirty(chunkX, chunkZ);
        
        return true;
    }

    place(x, y, z, playerPosition, doorType = 'oak') {
        const worldKey = `${x},${y},${z}`;
        const topWorldKey = `${x},${y+1},${z}`;

        this.doorTypes.set(worldKey, doorType);
        this.doorTypes.set(topWorldKey, doorType);

        if (playerPosition) {
            const doorToPlayer = new THREE.Vector2(
                playerPosition.x - (x + 0.5),
                playerPosition.z - (z + 0.5)
            );
            
            doorToPlayer.normalize();
            
            const angle = Math.atan2(doorToPlayer.y, doorToPlayer.x);
            
            let orientation;
            if (angle >= -Math.PI/4 && angle < Math.PI/4) {
                orientation = 3;
            } else if (angle >= Math.PI/4 && angle < 3*Math.PI/4) {
                orientation = 0;
            } else if (angle >= 3*Math.PI/4 || angle < -3*Math.PI/4) {
                orientation = 1;
            } else {
                orientation = 2;
            }
            
            this.doorOrientations.set(worldKey, orientation);
            this.doorOrientations.set(topWorldKey, orientation);
        } else {
            this.doorOrientations.set(worldKey, 0);
            this.doorOrientations.set(topWorldKey, 0);
        }
        
        this.doorStates.set(worldKey, false);
        this.doorStates.set(topWorldKey, false);
    }

    remove(x, y, z) {
        const worldKey = `${x},${y},${z}`;
        this.doorStates.delete(worldKey);
        this.doorOrientations.delete(worldKey);
        this.doorTypes.delete(worldKey);
    }

    isOpen(x, y, z) {
        const worldKey = `${x},${y},${z}`;
        return this.doorStates.get(worldKey) || false;
    }

    getOrientation(x, y, z) {
        const worldKey = `${x},${y},${z}`;
        return this.doorOrientations.get(worldKey) || 0;
    }

    getDoorType(x, y, z) {
        const worldKey = `${x},${y},${z}`;
        return this.doorTypes.get(worldKey) || 'oak';
    }

    isSolid(x, y, z) {
        const worldKey = `${x},${y},${z}`;
        const isOpen = this.doorStates.get(worldKey) || false;
        return !isOpen;
    }
}