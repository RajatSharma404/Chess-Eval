'use client';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Environment, Sphere, Cylinder, Box } from '@react-three/drei';
import * as THREE from 'three';

function FallenKingMesh() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Subtle rocking motion
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.8, 0]} rotation={[0, 0, Math.PI / 2 + 0.2]}>
      {/* Base */}
      <Cylinder args={[1.2, 1.4, 0.4, 32]} position={[0, -1.5, 0]}>
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
      </Cylinder>
      {/* Body */}
      <Cylinder args={[0.5, 1, 2, 32]} position={[0, -0.3, 0]}>
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.3} />
      </Cylinder>
      {/* Crown Base */}
      <Cylinder args={[0.8, 0.6, 0.4, 32]} position={[0, 0.9, 0]}>
        <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.4} />
      </Cylinder>
      {/* Cross Vertical */}
      <Box args={[0.2, 0.6, 0.2]} position={[0, 1.4, 0]}>
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </Box>
      {/* Cross Horizontal */}
      <Box args={[0.6, 0.2, 0.2]} position={[0, 1.4, 0]}>
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </Box>
    </group>
  );
}

export function FallenKing() {
  return (
    <div className="w-48 h-48 relative mx-auto opacity-70">
      <Canvas camera={{ position: [0, 3, 6], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.2} />
        <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} intensity={1.5} color="#eab308" castShadow />
        <pointLight position={[-5, 2, -5]} intensity={0.5} color="#3b82f6" />
        <FallenKingMesh />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
