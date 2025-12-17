import {
  useAuth as useCtx,
  useUserId as useUserIdCtx,
  useActiveProfileId as useActiveProfileIdCtx,
  useUserEmail as useUserEmailCtx,
  useSessionRestored as useSessionRestoredCtx,
  useWaitForAuthReady as useWaitForAuthReadyCtx,
} from '@/shared/context/AuthContext';

export {
  useCtx as useAuth,
  useUserIdCtx as useUserId,
  useActiveProfileIdCtx as useActiveProfileId,
  useUserEmailCtx as useUserEmail,
  useSessionRestoredCtx as useSessionRestored,
  useWaitForAuthReadyCtx as useWaitForAuthReady,
};
