import * as THREE from 'https://unpkg.com/three@0.170.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';

const container = document.getElementById('carro3d');

if (container) {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        35,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );
    camera.position.set(0, 0.6, 4);

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    const luzAmbiente = new THREE.HemisphereLight(0xffffff, 0x334433, 3);
    scene.add(luzAmbiente);

    const luzPrincipal = new THREE.DirectionalLight(0xffffff, 4);
    luzPrincipal.position.set(3, 5, 5);
    scene.add(luzPrincipal);

    const luzFrontal = new THREE.DirectionalLight(0xffffff, 2);
    luzFrontal.position.set(-4, 2, 4);
    scene.add(luzFrontal);

    // Luz suave para destacar o contorno do carro
    const luzContorno = new THREE.DirectionalLight(0xdceee2, 1.5);
    luzContorno.position.set(-3, 2, -4);
    scene.add(luzContorno);

    const farolEsquerdo = new THREE.PointLight(0xfff1c2, 0, 2.2, 2);
    const farolDireito = new THREE.PointLight(0xfff1c2, 0, 2.2, 2);
    farolEsquerdo.position.set(1.15, 0.12, 0.34);
    farolDireito.position.set(1.15, 0.12, -0.34);
    scene.add(farolEsquerdo, farolDireito);

    const carro = new THREE.Group();
    scene.add(carro);

    const loader = new GLTFLoader();

    loader.load(
        './assets/3d/bmw_m4csl.glb',
        (gltf) => {
            const modelo = gltf.scene;

            // Muda a cor da carroceria
            const materiaisFarol = [];
            modelo.traverse((obj) => {
                if (!obj.isMesh) return;

                const materiais = Array.isArray(obj.material)
                    ? obj.material
                    : [obj.material];

                materiais.forEach((material) => {
                    if (!material?.color) return;

                    const nome = material.name.toLowerCase();

                    if (/head.?light|lamp|farol/.test(nome)) {
                        materiaisFarol.push(material);
                        if (material.emissive) {
                            material.emissive.set('#fff1c2');
                            material.emissiveIntensity = 0;
                        }
                    }

                    if (
                        nome === 'car_paint' ||
                        nome === 'car_paint_.001'
                    ) {
                        material.color.set('#34483B');
                        material.metalness = 0.45;
                        material.roughness = 0.32;
                    }
                });
            });

            carro.add(modelo);

            // Centraliza e aumenta o modelo
            const box = new THREE.Box3().setFromObject(modelo);
            const centro = box.getCenter(new THREE.Vector3());
            const tamanho = box.getSize(new THREE.Vector3());

            const maiorDimensao = Math.max(
                tamanho.x,
                tamanho.y,
                tamanho.z
            );

            let escala = 1;

            if (maiorDimensao > 0) {
                escala = 2.8 / maiorDimensao;
                modelo.scale.setScalar(escala);
                modelo.position.copy(centro).multiplyScalar(-escala);
            }

            // Cria uma sombra suave embaixo do carro
            const canvasSombra = document.createElement('canvas');
            canvasSombra.width = 256;
            canvasSombra.height = 256;

            const ctx = canvasSombra.getContext('2d');
            const gradiente = ctx.createRadialGradient(
                128, 128, 12,
                128, 128, 120
            );

            gradiente.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
            gradiente.addColorStop(0.45, 'rgba(0, 0, 0, 0.22)');
            gradiente.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradiente;
            ctx.fillRect(0, 0, 256, 256);

            const texturaSombra = new THREE.CanvasTexture(canvasSombra);

            const materialSombra = new THREE.MeshBasicMaterial({
                map: texturaSombra,
                transparent: true,
                depthWrite: false,
                opacity: 0.7
            });

            const sombra = new THREE.Mesh(
                new THREE.PlaneGeometry(
                    tamanho.x * escala * 1.5,
                    tamanho.z * escala * 1.8
                ),
                materialSombra
            );

            sombra.rotation.x = -Math.PI / 2;
            sombra.position.y = -(tamanho.y * escala) / 2 - 0.025;
            sombra.renderOrder = 1;
            carro.add(sombra);

            carro.rotation.y = -0.5;

            const atualizarFaróis = (tema) => {
                const escuro = tema === 'dark';
                farolEsquerdo.intensity = escuro ? 2.4 : 0;
                farolDireito.intensity = escuro ? 2.4 : 0;
                materiaisFarol.forEach((material) => {
                    if (material.emissive) material.emissiveIntensity = escuro ? 2.5 : 0;
                });
            };
            atualizarFaróis(document.documentElement.dataset.theme || 'light');
            window.addEventListener('simpled-theme-change', (evento) => atualizarFaróis(evento.detail.theme));

            console.log('BMW M4 CSL carregada!');
        },
        undefined,
        (erro) => {
            console.error('Erro ao carregar BMW:', erro);
        }
    );

    let rotacaoAlvo = 0;
    let rotacaoAtual = 0;
    let ultimoScroll = window.scrollY;

    window.addEventListener('scroll', () => {
        const scrollAtual = window.scrollY;
        const diferenca = scrollAtual - ultimoScroll;

        rotacaoAlvo += diferenca * 0.008;
        ultimoScroll = scrollAtual;
    });

    function animar() {
        requestAnimationFrame(animar);

        rotacaoAtual += (rotacaoAlvo - rotacaoAtual) * 0.08;
        carro.rotation.y = -0.5 + rotacaoAtual;

        renderer.render(scene, camera);
    }

    animar();

    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (!width || !height) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}
