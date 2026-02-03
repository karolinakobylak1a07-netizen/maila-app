import {
  archiveClientProfileSchema,
  completeDiscoverySchema,
  createStrategicDecisionSchema,
  getDiscoveryStateSchema,
  listRbacPoliciesSchema,
  clientProfileInputSchema,
  clientProfileUpdateSchema,
  listStrategicDecisionsSchema,
  saveDiscoveryDraftSchema,
  updateRbacPolicySchema,
  switchClientContextSchema,
} from "./contracts/clients.schema";
import { ClientsService } from "./server/clients.service";
import { assertSessionRole, mapDomainErrorToTRPC } from "./clients.router.logic";
import { createTRPCRouter, protectedProcedure } from "../../server/api/trpc";

type ClientsServiceContract = Pick<
  ClientsService,
  | "listProfiles"
  | "createProfile"
  | "updateProfile"
  | "archiveProfile"
  | "switchActiveContext"
  | "rememberLastView"
  | "getActiveContext"
  | "listStrategicDecisions"
  | "createStrategicDecision"
  | "getDiscoveryState"
  | "saveDiscoveryDraft"
  | "completeDiscovery"
  | "getRbacPolicies"
  | "updateRbacPolicy"
>;

export const createClientsRouter = (
  clientsService: ClientsServiceContract = new ClientsService(),
) =>
  createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await clientsService.listProfiles(
          ctx.session.user.id,
          assertSessionRole(ctx.session.user.role),
        );
      } catch (error) {
        mapDomainErrorToTRPC(error);
      }
    }),

    create: protectedProcedure
      .input(clientProfileInputSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await clientsService.createProfile(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    update: protectedProcedure
      .input(clientProfileUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await clientsService.updateProfile(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    archive: protectedProcedure
      .input(archiveClientProfileSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await clientsService.archiveProfile(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    switchActive: protectedProcedure
      .input(switchClientContextSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await clientsService.switchActiveContext(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    rememberLastView: protectedProcedure
      .input(
        switchClientContextSchema.refine(
          (value) => Boolean(value.lastViewPath),
          "lastViewPath_required",
        ),
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await clientsService.rememberLastView(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            {
              clientId: input.clientId,
              lastViewPath: input.lastViewPath!,
            },
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    getActiveContext: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await clientsService.getActiveContext(
          ctx.session.user.id,
          assertSessionRole(ctx.session.user.role),
        );
      } catch (error) {
        mapDomainErrorToTRPC(error);
      }
    }),

    listDecisions: protectedProcedure
      .input(listStrategicDecisionsSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await clientsService.listStrategicDecisions(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    createDecision: protectedProcedure
      .input(createStrategicDecisionSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await clientsService.createStrategicDecision(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    getDiscoveryState: protectedProcedure
      .input(getDiscoveryStateSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await clientsService.getDiscoveryState(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    saveDiscoveryDraft: protectedProcedure
      .input(saveDiscoveryDraftSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await clientsService.saveDiscoveryDraft(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    completeDiscovery: protectedProcedure
      .input(completeDiscoverySchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await clientsService.completeDiscovery(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    getRbacPolicies: protectedProcedure
      .input(listRbacPoliciesSchema.optional())
      .query(async ({ ctx, input }) => {
        try {
          const requestId = ctx.headers.get("x-request-id") ?? `local-${Date.now()}`;
          return await clientsService.getRbacPolicies(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            requestId,
            input ?? {},
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),

    updateRbacPolicy: protectedProcedure
      .input(updateRbacPolicySchema)
      .mutation(async ({ ctx, input }) => {
        try {
          const requestId = ctx.headers.get("x-request-id") ?? `local-${Date.now()}`;
          return await clientsService.updateRbacPolicy(
            ctx.session.user.id,
            assertSessionRole(ctx.session.user.role),
            input,
            requestId,
          );
        } catch (error) {
          mapDomainErrorToTRPC(error);
        }
      }),
  });

export const clientsRouter = createClientsRouter();
