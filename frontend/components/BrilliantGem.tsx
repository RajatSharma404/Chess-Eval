'use client';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function GemMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current && outerRef.current) {
      meshRef.current.rotation.y += delta * 3;
      meshRef.current.rotation.z += delta * 2;
      outerRef.current.rotation.y -= delta * 1;
      outerRef.current.rotation.x += delta * 1;
    }
  });

  return (
    <Float speed={5} rotationIntensity={2} floatIntensity={2}>
      {/* Outer Glow Wireframe */}
      <Icosahedron args={[1.5, 0]} ref={outerRef}>
        <meshBasicMaterial color="#22d3ee" wireframe={true} transparent opacity={0.3} />
      </Icosahedron>
      
      {/* Inner Gem */}
      <Icosahedron args={[1, 0]} ref={meshRef}>
        <MeshDistortMaterial 
          color="#06b6d4" 
          emissive="#0891b2"
          emissiveIntensity={2} 
          distort={0.2} 
          speed={3} 
          roughness={0} 
          metalness={1}
          clearcoat={1}
        />
      </Icosahedron>
    </Float>
  );
}

export function BrilliantGem() {
  return (
    <div className="w-16 h-16 relative flex-shrink-0">
      <div className="absolute inset-0 bg-cyan-400/30 blur-[20px] rounded-full animate-pulse" />
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={1} />
        <pointLight position={[0, 0, 2]} intensity={2} color="#67e8f9" />
        <GemMesh />
      </Canvas>
    </div>
  );
}
