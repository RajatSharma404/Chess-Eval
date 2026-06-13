'use client';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Environment, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function KnightCore() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[2, 0]} />
        <meshPhysicalMaterial 
          color="#10b981" 
          emissive="#047857"
          emissiveIntensity={0.5}
          wireframe={true}
          transparent={true}
          opacity={0.8}
        />
        {/* Inner core */}
        <Sphere args={[1.2, 32, 32]}>
          <MeshDistortMaterial 
            color="#34d399" 
            emissive="#10b981"
            emissiveIntensity={1} 
            distort={0.4} 
            speed={2} 
            roughness={0}
          />
        </Sphere>
      </mesh>
    </Float>
  );
}

export function HeroKnight() {
  return (
    <div className="w-32 h-32 sm:w-40 sm:h-40 relative">
      <div className="absolute inset-0 bg-emerald-500/20 blur-[50px] rounded-full" />
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
        <KnightCore />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  );
}
