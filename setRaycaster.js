import { Vector2, Raycaster } from "three";

export default function setRaycaster({ scene, camera, eventObject, onClick }) {
  const raycaster = new Raycaster();
  // const mouse = { x: 0, y: 0 };
  const mouse = new Vector2();
  let isDragging = false; // 드래그 하면 true

  eventObject.addEventListener("mousedown", () => (isDragging = false));
  eventObject.addEventListener("mousemove", () => (isDragging = true));
  eventObject.addEventListener("click", (e) => {
    if (isDragging) return;

    // if(eventObject === window) {
    mouse.x = (e.clientX / eventObject.clientWidth) * 2 - 1;
    mouse.y = -(e.clientY / eventObject.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera); // 마우스좌표 정보와 카메라를 이용해서 설정

    // ray(광선)에 맞은 메쉬들을 체크
    const intersects = raycaster.intersectObjects(scene.children, true);
    console.log("클릭된 객체들:", intersects.length);

    for (const item of intersects) {
      if (item.object.isMesh) {
        console.log("클릭된 메시:", item.object.name);

        // 클릭 불가능한 객체는 무시
        if (item.object.userData && item.object.userData.clickable === false) {
          console.log("클릭 불가능한 객체 무시:", item.object.name);
          continue;
        }

        // 부모 객체 찾기
        let targetObject = item.object;
        while (targetObject.parent && !targetObject.name.startsWith("rock_")) {
          targetObject = targetObject.parent;
          console.log("부모 확인:", targetObject.name);

          // 부모도 클릭 불가능하면 무시
          if (
            targetObject.userData &&
            targetObject.userData.clickable === false
          ) {
            console.log("클릭 불가능한 부모 객체 무시:", targetObject.name);
            break;
          }
        }

        // rock_로 시작하는 객체를 찾았거나, userData.id가 있는 객체를 찾았을 때
        if (
          targetObject.name.startsWith("rock_") ||
          targetObject.userData.id !== undefined
        ) {
          console.log(
            "바위 클릭 감지:",
            targetObject.name,
            targetObject.userData
          );
          if (onClick) onClick(targetObject);
          break;
        }
      }
    }
  });
}
