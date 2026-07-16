"use client";

import {
  useMemo,
} from "react";
import {
  useQueries,
  useQuery,
} from "@tanstack/react-query";

import {
  getProjectKnowledgeBases,
} from "@/services/knowledge-bases";
import {
  getOrganizations,
} from "@/services/organizations";
import {
  getOrganizationProjects,
} from "@/services/projects";
import type {
  KnowledgeBase,
} from "@/types/knowledge-base";
import type {
  Project,
} from "@/types/project";

export interface KnowledgeBaseOption
  extends KnowledgeBase {
  project_name: string;
  organization_id: string;
  organization_name: string;
}

export function useAllKnowledgeBases() {
  const organizationsQuery =
    useQuery({
      queryKey: [
        "organizations",
      ],
      queryFn:
        getOrganizations,
    });

  const organizations =
    useMemo(
      () =>
        organizationsQuery.data
          ?.items ?? [],
      [
        organizationsQuery.data
          ?.items,
      ],
    );

  const projectQueries =
    useQueries({
      queries:
        organizations.map(
          (
            organization,
          ) => ({
            queryKey: [
              "organization-projects",
              organization.id,
            ],

            queryFn: () =>
              getOrganizationProjects(
                organization.id,
              ),

            enabled:
              Boolean(
                organization.id,
              ),
          }),
        ),
    });

  const projects =
    useMemo(() => {
      const result: Array<
        Project & {
          organization_name: string;
        }
      > = [];

      projectQueries.forEach(
        (
          query,
          index,
        ) => {
          const organization =
            organizations[index];

          if (!organization) {
            return;
          }

          const items =
            query.data?.items ??
            [];

          items.forEach(
            (project) => {
              result.push({
                ...project,
                organization_name:
                  organization.name,
              });
            },
          );
        },
      );

      return result;
    }, [
      organizations,
      projectQueries,
    ]);

  const knowledgeBaseQueries =
    useQueries({
      queries:
        projects.map(
          (project) => ({
            queryKey: [
              "project-knowledge-bases",
              project.id,
            ],

            queryFn: () =>
              getProjectKnowledgeBases(
                project.id,
              ),

            enabled:
              Boolean(
                project.id,
              ),
          }),
        ),
    });

  const knowledgeBases =
    useMemo(() => {
      const result:
        KnowledgeBaseOption[] =
        [];

      knowledgeBaseQueries.forEach(
        (
          query,
          index,
        ) => {
          const project =
            projects[index];

          if (!project) {
            return;
          }

          const items =
            query.data?.items ??
            [];

          items.forEach(
            (knowledgeBase) => {
              result.push({
                ...knowledgeBase,
                project_name:
                  project.name,
                organization_id:
                  project.organization_id,
                organization_name:
                  project.organization_name,
              });
            },
          );
        },
      );

      return result;
    }, [
      knowledgeBaseQueries,
      projects,
    ]);

  const error =
    organizationsQuery.error ??
    projectQueries.find(
      (query) =>
        query.isError,
    )?.error ??
    knowledgeBaseQueries.find(
      (query) =>
        query.isError,
    )?.error;

  const isLoading =
    organizationsQuery.isLoading ||
    projectQueries.some(
      (query) =>
        query.isLoading,
    ) ||
    knowledgeBaseQueries.some(
      (query) =>
        query.isLoading,
    );

  const isFetching =
    organizationsQuery.isFetching ||
    projectQueries.some(
      (query) =>
        query.isFetching,
    ) ||
    knowledgeBaseQueries.some(
      (query) =>
        query.isFetching,
    );

  const isError =
    organizationsQuery.isError ||
    projectQueries.some(
      (query) =>
        query.isError,
    ) ||
    knowledgeBaseQueries.some(
      (query) =>
        query.isError,
    );

  async function refetchAll(): Promise<void> {
    await organizationsQuery.refetch();

    await Promise.all(
      projectQueries.map(
        (query) =>
          query.refetch(),
      ),
    );

    await Promise.all(
      knowledgeBaseQueries.map(
        (query) =>
          query.refetch(),
      ),
    );
  }

  return {
    knowledgeBases,
    organizations,
    projects,
    isLoading,
    isFetching,
    isError,
    error,
    refetchAll,
  };
}