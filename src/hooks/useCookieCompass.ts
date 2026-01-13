import { useEffect, useState } from "react";

// 1. 필요한 타입 정의
interface Location {
    latitude: number;
    longitude: number;
}

export function useCookieCompass() {
  //  2. 상태(State) 만들기: 변하는 값들을 저장할 곳
  const [location, setLocation] = useState<Location | null>(null)    
  const [heading, setHeading] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  // 3. GPS 추적 로직 (Effect 1)
   useEffect(() => {
    // 3.1. 브라우저가 GPS를 지원하지 않는다면
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.")
      return
    }

    // 3-2. 실시간 위치 감시 시작 (watchPosition)
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        setError(error.message)
      },
      {
        enableHighAccuracy: true // 정밀 모드
      }
    )

    // 3-3. 위치 감시 종료
    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
   }, [])

   // 4. 나침반(DeviceOrientation) 추적 로직 (Effect 2)
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha) {
        setHeading(event.alpha)
      }
    }

    // 이벤트 리스너 등록
    window.addEventListener("deviceorientation", handleOrientation)

    // 뒷정리
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation)
    }
  }, [])

  // 5. 값 내보내기 (Hook의 반환값)
  return {location, heading, error}

}