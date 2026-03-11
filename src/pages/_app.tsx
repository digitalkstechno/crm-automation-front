import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const noLayoutRoutes = ["/login", "/public-form"];
  const shouldUseLayout = !noLayoutRoutes.includes(router.pathname);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token && router.pathname !== "/login" && router.pathname !== "/public-form") {
      router.push("/login");
      setIsLoading(false);
    } else if (token) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [router.pathname]);

  useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated && router.pathname !== "/login" && router.pathname !== "/public-form") {
    return null;
  }

  return (
    <>
      <Toaster position="top-right" />
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>
            <p className="text-sm text-gray-900 font-medium">Loading...</p>
          </div>
        </div>
      )}
      {shouldUseLayout ? (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        <Component {...pageProps} />
      )}
    </>
  );
}
