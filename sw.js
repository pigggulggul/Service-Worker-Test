// preload 활성화
const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    await self.registration.navigationPreload.enable();
  }
};

const addResourcesToCache = async (resources) => {
  const cache = await caches.open("v1");
  await cache.addAll(resources);
};

// install event
self.addEventListener("install", (e) => {
  console.log("[Service Worker] installed");
  e.waitUntil(
    addResourcesToCache([
      "/",
      "/index.html",
      "/sw.js",
      "/src/assets/images/frame1.png",
      "/src/assets/images/frame2.png",
      "/src/assets/images/frame3.png",
    ])
  );
});

/** 캐쉬삭제
const deleteCache = async (key) => {
  await caches.delete(key);
};

const deleteOldCaches = async () => {
  const cacheKeepList = ["v2"];
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
  await Promise.all(cachesToDelete.map(deleteCache));
};
self.addEventListener("activate", (event) => {
  event.waitUntil(deleteOldCaches());
});
*/

// activate event
self.addEventListener("activate", (e) => {
  console.log("[Service Worker] actived", e);
  e.waitUntil(enableNavigationPreload());
});

// 캐쉬에 저장
const putInCache = async (request, response) => {
  const cache = await caches.open("v1");
  await cache.put(request, response);
};

// 리소스가 있는지 없는지 확인
const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }

  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
    console.info("using preload response", preloadResponse);
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }

  //리소스가 없으면 네트워크로 요청을 보내고 캐쉬에 저장하기
  try {
    const responseFromNetwork = await fetch(request);
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

// fetch event
self.addEventListener("fetch", (e) => {
  console.log("[Service Worker] fetched resource " + e.request.url);
  e.respondWith(
    cacheFirst({
      request: e.request,
      preloadResponsePromise: e.preloadResponse,
      // 여기서 fallbackUrl은 네트워크 요청이 실패했을 때 사용되는 백업 리소스의 URL을 의미합니다
      // 위의 경우 네트워크 요청이 실패 할 시 대체 이미지를 보여줌
      fallbackUrl: "/src/assets/images/frame1.png",
    })
  );
});
