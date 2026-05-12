import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock functions — must be created before vi.mock() factories run
// ---------------------------------------------------------------------------
const { mockUserFindById, mockLabFindAll } = vi.hoisted(() => ({
  mockUserFindById: vi.fn(),
  mockLabFindAll: vi.fn(),
}));

vi.mock("../repositories", () => ({
  UserRepository: class {
    findById = mockUserFindById;
    findByStatus = vi.fn();
    findByRoleId = vi.fn();
    findAll = vi.fn();
    findByEmail = vi.fn();
  },
  LabRepository: class {
    findAll = mockLabFindAll;
  },
}));

// Prisma client is pulled in transitively – stub it out entirely
vi.mock("../db/client", () => ({ default: {} }));

import { UserService } from "./user.service";

// ---------------------------------------------------------------------------

const ADMIN_ROLE_ID = 1;
const EDITOR_ROLE_ID = 2;

const allLabsInDb = [
  { id: BigInt(1), name: "Geneva" },
  { id: BigInt(2), name: "Lyon" },
  { id: BigInt(3), name: "Brussels" },
];

function makeAdminUser(labRelations: { id: bigint; name: string }[] = []) {
  return {
    id: BigInt(99),
    role_id: ADMIN_ROLE_ID,
    living_lab_user_relation: labRelations.map((l) => ({ lab: l })),
  };
}

function makeEditorUser(labRelations: { id: bigint; name: string }[]) {
  return {
    id: BigInt(42),
    role_id: EDITOR_ROLE_ID,
    living_lab_user_relation: labRelations.map((l) => ({ lab: l })),
  };
}

describe("UserService.getUserLabs", () => {
  let service: UserService;

  beforeEach(() => {
    mockUserFindById.mockReset();
    mockLabFindAll.mockReset();
    service = new UserService();
  });

  // --- admin -----------------------------------------------------------------

  it("returns all labs from DB for an admin with no lab relations", async () => {
    mockUserFindById.mockResolvedValue(makeAdminUser([]));
    mockLabFindAll.mockResolvedValue(allLabsInDb);

    const result = await service.getUserLabs("99");

    expect(result).toEqual([
      { id: "1", name: "Geneva" },
      { id: "2", name: "Lyon" },
      { id: "3", name: "Brussels" },
    ]);
    expect(mockLabFindAll).toHaveBeenCalledOnce();
  });

  it("returns all labs from DB for an admin who also has explicit lab relations", async () => {
    mockUserFindById.mockResolvedValue(makeAdminUser([allLabsInDb[0]]));
    mockLabFindAll.mockResolvedValue(allLabsInDb);

    const result = await service.getUserLabs("99");

    // Should still return ALL labs, not just the one in their relation
    expect(result).toHaveLength(3);
    expect(mockLabFindAll).toHaveBeenCalledOnce();
  });

  // --- non-admin editor ------------------------------------------------------

  it("returns only the user's related labs for a non-admin", async () => {
    mockUserFindById.mockResolvedValue(
      makeEditorUser([allLabsInDb[0], allLabsInDb[1]])
    );

    const result = await service.getUserLabs("42");

    expect(result).toEqual([
      { id: "1", name: "Geneva" },
      { id: "2", name: "Lyon" },
    ]);
    expect(mockLabFindAll).not.toHaveBeenCalled();
  });

  it("returns empty array for a non-admin with no lab relations", async () => {
    mockUserFindById.mockResolvedValue(makeEditorUser([]));

    const result = await service.getUserLabs("42");

    expect(result).toEqual([]);
    expect(mockLabFindAll).not.toHaveBeenCalled();
  });

  // --- error handling --------------------------------------------------------

  it("throws if user is not found", async () => {
    mockUserFindById.mockResolvedValue(null);

    await expect(service.getUserLabs("99")).rejects.toThrow(
      "Failed to retrieve user labs"
    );
  });
});
