'use client';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Environment, Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedPawn() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 2;
    }
  });

  return (
    <Float speed={4} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={groupRef} position={[0, -1, 0]}>
        {/* Base */}
        <Cylinder args={[1, 1.2, 0.4, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#10b981" metalness={0.8} roughness={0.2} />
        </Cylinder>
        {/* Body */}
        <Cylinder args={[0.4, 0.8, 1.5, 32]} position={[0, 0.95, 0]}>
          <meshStandardMaterial color="#34d399" metalness={0.5} roughness={0.1} />
        </Cylinder>
        {/* Collar */}
        <Cylinder args={[0.6, 0.6, 0.2, 32]} position={[0, 1.8, 0]}>
          <meshStandardMaterial color="#059669" metalness={0.9} roughness={0.3} />
        </Cylinder>
        {/* Head */}
        <Sphere args={[0.6, 32, 32]} position={[0, 2.3, 0]}>
          <meshStandardMaterial color="#10b981" emissive="#047857" emissiveIntensity={0.5} metalness={0.8} roughness={0.1} />
        </Sphere>
      </group>
    </Float>
  );
}

export function LoadingPiece() {
  return (
    <div className="w-24 h-24 relative">
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#06b6d4" />
        <AnimatedPawn />
        <Environment preset="studio" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  );
}
