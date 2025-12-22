import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        // Dark blue-gray background matching the theme
        scene.background = new THREE.Color(0x0f172a);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 20;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Particles
        const geometry = new THREE.BufferGeometry();
        const count = 1500;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 60; // Spread heavily
            colors[i] = Math.random(); // Gradient base
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
        });

        const particlesMesh = new THREE.Points(geometry, material);
        scene.add(particlesMesh);

        // Dynamic Geometric Shapes
        const shapesGroup = new THREE.Group();

        // Icosahedron (Network Node) - Wireframe
        const icoGeometry = new THREE.IcosahedronGeometry(6, 1);
        const icoMaterial = new THREE.MeshBasicMaterial({
            color: 0x3b82f6, // Blue-500
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        const icoCombined = new THREE.Mesh(icoGeometry, icoMaterial);
        shapesGroup.add(icoCombined);

        // Inner Sphere
        const sphereGeo = new THREE.SphereGeometry(3, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: 0x6366f1, // Indigo-500
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        shapesGroup.add(sphere);

        // Torus Ring
        const torusGeo = new THREE.TorusGeometry(10, 0.1, 16, 100);
        const torusMat = new THREE.MeshBasicMaterial({
            color: 0x14b8a6, // Teal-500
            transparent: true,
            opacity: 0.3
        });
        const torus = new THREE.Mesh(torusGeo, torusMat);
        torus.rotation.x = Math.PI / 2;
        shapesGroup.add(torus);

        scene.add(shapesGroup);

        // Animation Loop
        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);

            // Rotate entire particle system very slowly
            particlesMesh.rotation.y += 0.0005;
            particlesMesh.rotation.x += 0.0002;

            // Rotate Geometric Shapes
            shapesGroup.rotation.y -= 0.002;
            shapesGroup.rotation.z += 0.001;

            // Pulse effect for Icosahedron
            const scale = 1 + Math.sin(Date.now() * 0.001) * 0.05;
            icoCombined.scale.set(scale, scale, scale);

            renderer.render(scene, camera);
        };

        animate();

        // Handle Resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            // Dispose geometries/materials
            geometry.dispose();
            material.dispose();
            icoGeometry.dispose();
            icoMaterial.dispose();
            sphereGeo.dispose();
            sphereMat.dispose();
            torusGeo.dispose();
            torusMat.dispose();
            renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} className="fixed inset-0 z-0" />;
}
