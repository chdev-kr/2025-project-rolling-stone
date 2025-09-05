// 드래그 작동 안됨
import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import setRaycaster from "./setRaycaster.js";

// ----- Raycaster 설정 모듈

// Renderer
const canvas = document.getElementById("three-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true, // 계단 현상 방지
  // 게임이나 실시간 애플리케이션: antialias: false (성능 우선)
  // 정적 이미지나 고품질 렌더링: antialias: true (품질 우선)
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);

// Scene
const scene = new THREE.Scene();
// 배경색을 하늘색으로 설정
scene.background = new THREE.Color(0x87ceeb); // 하늘색 (Sky Blue)

// Camera
const camera = new THREE.PerspectiveCamera(
  75, // 1. 시야각(FOV, field of view)
  window.innerWidth / window.innerHeight, // 2. 종횡비(Aspect Ratio)
  1, // 3. near (카메라에서 가장 가까운 렌더링 거리)
  500 // 4. far (카메라에서 가장 먼 렌더링 거리)
);

// z축: 앞쪽이 양수(+), 뒤쪽이 음수(-)
camera.position.x = 100; // 카메라를 중앙에 배치
camera.position.y = 20; // 카메라를 Y축으로 10만큼 위로
camera.position.z = 310; // 카메라를 Z축으로 20만큼 뒤로
scene.add(camera);

// Light - GLB 모델을 잘 보이게 하기 위해 조명 강화
const ambientLight = new THREE.AmbientLight("white", 0.8); // 환경광 강도 증가
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight("white", 3); // 방향광 강도 증가
directionalLight.position.x = 5; // 광원 위치 조정
directionalLight.position.y = 10; // 위에서 비추도록
directionalLight.position.z = 5;
directionalLight.castShadow = true; // 그림자 활성화
scene.add(directionalLight);

// 추가 조명 - 산의 다른 면도 밝게 보이도록
const directionalLight2 = new THREE.DirectionalLight("white", 2);
directionalLight2.position.x = -5;
directionalLight2.position.y = 5;
directionalLight2.position.z = -5;
scene.add(directionalLight2);

// 포인트 라이트 추가 - 산 주변을 더 밝게
const pointLight = new THREE.PointLight("white", 2, 50);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

// const controls = new OrbitControls(camera, renderer.domElement);

// GLB 모델 로더 생성
const gltfLoader = new GLTFLoader();

// 모델 변수들
let mountainModel = null;
let rockModel = null;

// 게임 변수들
let score = 0; // 점수

// 산 모델 로드 함수
function loadMountainModel() {
  gltfLoader.load(
    "./models/mountain_glacier.glb", // 산 모델 파일 경로
    (gltf) => {
      console.log("산 모델 로드 성공!", gltf);
      mountainModel = gltf.scene.clone(); // 원본 모델 복사본 저장

      // 산 모델 설정
      const model = mountainModel.clone();
      model.scale.set(1.5, 1.5, 1.5);
      model.position.set(0, 0, 0);
      model.name = "mountain";

      // Mountain의 raycasting 비활성화 (올바른 방법)
      model.traverse((child) => {
        if (child.isMesh) {
          child.userData = { ...child.userData, clickable: false }; // 클릭 불가능 표시
        }
      });

      scene.add(model);

      console.log("산 모델이 씬에 추가되었습니다!");
    },
    (progress) => {
      console.log(
        "산 모델 로딩 진행률:",
        (progress.loaded / progress.total) * 100 + "%"
      );
    },
    (error) => {
      console.error("산 모델 로드 실패:", error);
    }
  );
}

// 바위 모델 로드 함수
function loadRockModel() {
  gltfLoader.load(
    "./models/rock.glb", // 바위 모델 파일 경로
    (gltf) => {
      console.log("바위 모델 로드 성공!", gltf);
      rockModel = gltf.scene.clone(); // 원본 모델 복사본 저장

      // 바위 mesh들 생성
      createRockMeshes();
    },
    (progress) => {
      console.log(
        "바위 모델 로딩 진행률:",
        (progress.loaded / progress.total) * 100 + "%"
      );
    },
    (error) => {
      console.error("바위 모델 로드 실패:", error);
    }
  );
}

// 바위 mesh들 생성 함수
function createRockMeshes() {
  const rockCount = 5; // 바위 개수

  for (let i = 0; i < rockCount; i++) {
    const rock = rockModel.clone(); // 바위 모델 복사

    // 재질을 독립적으로 만들기
    rock.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.isCloned = true;
      }
    });

    // 바위 크기 조정
    rock.scale.set(2.0, 2.0, 2.0); // 더 크게 설정

    // 카메라에서 멀리 위치에 바위 배치 (카메라를 향하도록)
    const distance = 400 + Math.random() * 100; // 400~500 거리

    // 카메라 앞쪽에서만 날아오도록 각도 제한 (앞쪽 90도 범위)
    const angleRange = Math.PI / 2; // 90도
    const angleOffset = -angleRange / 2; // -45도부터 시작
    const angle = angleOffset + (i / rockCount) * angleRange; // -45도 ~ +45도 범위

    // 카메라 위치를 기준으로 바위 배치
    rock.position.x = camera.position.x + Math.sin(angle) * distance; // X축은 sin 사용
    rock.position.y = 80 + Math.random() * 40; // 50 ~ 80 높이 (산 위에 배치)
    rock.position.z = camera.position.z - Math.cos(angle) * distance; // Z축은 cos 사용 (카메라 앞쪽)

    // 디버깅: 바위 위치 출력
    console.log(`바위 ${i} 위치:`, rock.position);

    // 바위가 카메라를 향하도록 회전 (간단하게)
    rock.lookAt(camera.position);

    // 바위에 고유 ID와 이름 설정
    rock.userData = {
      id: i,
      type: "rock",
      speed: 0.5 + Math.random() * 0.3, // 0.5~0.8 속도 (적당한 속도로)
      originalPosition: rock.position.clone(),
    };
    rock.name = `rock_${i}`;

    // 바위를 씬에 추가
    scene.add(rock);

    console.log(`바위 ${i} 생성됨! 위치:`, rock.position);
    console.log(`바위 ${i} 크기:`, rock.scale);
    console.log(`바위 ${i} 이름:`, rock.name);
    console.log(`바위 ${i} 씬에 추가됨:`, scene.children.includes(rock));
  }
}

// 새로운 바위 생성 함수
function createNewRock(rockId) {
  const rock = rockModel.clone(); // 바위 모델 복사

  rock.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = child.material.clone();
      child.material.isCloned = true;
    }
  });

  // 바위 크기 조정
  rock.scale.set(2.0, 2.0, 2.0); // 더 크게 설정

  // 카메라에서 멀리 위치에 바위 배치
  const distance = 400 + Math.random() * 100; // 400~500 거리
  // 카메라 앞쪽에서만 날아오도록 각도 제한 (앞쪽 90도 범위)
  const angleRange = Math.PI / 2; // 90도
  const angleOffset = -angleRange / 2; // -45도부터 시작
  const angle = angleOffset + Math.random() * angleRange; // -45도 ~ +45도 범위

  // 카메라 위치를 기준으로 바위 배치
  rock.position.x = camera.position.x + Math.sin(angle) * distance; // X축은 sin 사용
  rock.position.y = 50 + Math.random() * 30; // 50 ~ 80 높이 (산 위에 배치)
  rock.position.z = camera.position.z - Math.cos(angle) * distance; // Z축은 cos 사용 (카메라 앞쪽)

  // 바위가 카메라를 향하도록 회전 (간단하게)
  rock.lookAt(camera.position);

  // 바위에 고유 ID와 이름 설정
  rock.userData = {
    id: rockId,
    type: "rock",
    speed: 1.5 + Math.random() * 3, // 0.5~0.8 속도
    originalPosition: rock.position.clone(),
  };
  rock.name = `rock_${rockId}`;

  // 바위를 씬에 추가
  scene.add(rock);

  console.log(`새로운 바위 ${rockId} 생성됨! 위치:`, rock.position);
}

// 모델들 로드 실행
console.log("모델 로드 시작...");
loadMountainModel();
loadRockModel();
updateScore();
console.log("모델 로드 함수 호출 완료");

setRaycaster({
  scene,
  camera,
  eventObject: canvas,
  onClick: function (object) {
    console.log("클릭된 객체:", object);
    console.log("객체 이름:", object.name);
    console.log("객체 타입:", object.type);
    console.log("객체 userData:", object.userData);
    if (object.name === "mountain") {
      console.log("산을 클릭했습니다!");
      // 모델의 색상 변경 예시
      object.traverse((child) => {
        if (child.isMesh) {
          child.material.color.set("lightblue");
        }
      });
    }

    // 바위 클릭 처리
    if (
      object.name &&
      (object.name.startsWith("rock_") || object.userData.id !== undefined)
    ) {
      console.log(`바위 ${object.userData.id}를 클릭했습니다!`);

      // 점수 증가
      score += 10;
      updateScore();

      // 바위 색상 변경
      object.traverse((child) => {
        if (child.isMesh) {
          child.material.color.set("red");
        }
      });

      // 0.5초 후 바위를 새 위치로 이동
      setTimeout(() => {
        scene.remove(object);
        createNewRock(object.userData.id);
        console.log(`바위 ${object.userData.id} 사라짐!`);
      }, 100);
    }
  },
});

// 기존 mesh들은 제거하고 GLB 모델만 사용
// 필요하다면 여기에 추가적인 mesh들을 생성할 수 있습니다

const clock = new THREE.Clock();

// 브라우저 창의 크기가 바뀔 때마다 3D 장면을 적절하게 조정
window.addEventListener("resize", setSize);

// setAnimationLoop 메서드는 브라우저가 화면을 새로고침할 때마다 특정 함수를 자동적으로 실행
// 1) 브라우저가 화면을 새로고침
// 2) 매번 animate 함수가 실행
// 3) 3D 장면을 다시 그림
// 4) 무한 반복
renderer.setAnimationLoop(animate);

function animate() {
  const time = clock.getElapsedTime();

  // OrbitControls 업데이트
  // controls.update();

  // 바위들 애니메이션
  const rocksToRemove = []; // 제거할 바위들을 저장할 배열

  scene.children.forEach((child) => {
    if (child.name && child.name.startsWith("rock_")) {
      // 바위가 카메라를 향해 날아오는 애니메이션
      const direction = new THREE.Vector3();
      direction.subVectors(camera.position, child.position).normalize();

      // 바위를 카메라 방향으로 이동
      child.position.add(direction.multiplyScalar(child.userData.speed));

      // 바위가 카메라를 향하도록 회전
      child.lookAt(camera.position);

      // 바위가 카메라에 너무 가까워지면 제거 목록에 추가
      const distanceToCamera = child.position.distanceTo(camera.position);
      if (distanceToCamera < 50) {
        rocksToRemove.push(child);
      }
    }
  });

  // 제거할 바위들을 처리
  rocksToRemove.forEach((rock) => {
    // 바위를 씬에서 제거
    scene.remove(rock);

    // 새로운 바위 생성
    createNewRock(rock.userData.id);

    console.log(`바위 ${rock.userData.id} 사라짐!`);
  });

  renderer.render(scene, camera);
}

// 접수 업데이트 함수
function updateScore() {
  const scoreElement = document.getElementById("score-value");
  if (scoreElement) {
    scoreElement.textContent = score;
  }
}

function setSize() {
  // 1단계: 카메라 비율 계산(카메라의 가로세로 비율을 화면 크기에 맞게 조정
  camera.aspect = window.innerWidth / window.innerHeight;
  // 2단계: 카메라 설정 적용(변경사항 카메라에 적용)
  camera.updateProjectionMatrix();
  // 3단계: 렌더러(캔버스)의 크기를 화면 크기에 맞게 조정
  // 렌더러는 고정된 크기로 설정되어 있음
  // 화면이 커져도 렌더러가 작으면 검은 여백, 화면이 작아자도 렌더러가 크면 일부만 보이거나 스크롤바
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 4단계: 새로운 설정으로 장면을 다시 그리기
  renderer.render(scene, camera); // camera의 시점에서 scene을 렌더링
}
