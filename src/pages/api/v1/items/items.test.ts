import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET } from ".";
import type { APIContext } from "astro";
import { ItemService } from "../../../../bff/services/items.service";

describe("GET /api/v1/items - Retrieve items by category id", () => {
  let mockContext: Partial<APIContext>;
  let getItemsSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockContext = {
      request: new Request("http://localhost:3000/api/v1/items", {
        method: "GET",
      }),
      locals: {},
    } as Partial<APIContext>;

    getItemsSpy = vi.spyOn(ItemService.prototype, "getItems");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Happy path - Retrieve all items", () => {
    it("should return all items ordered by name when no category_id is provided", async () => {
      // Arrange
      const mockItems = [
        {
          id: BigInt(1),
          name: "Alpha Resource",
          orgname: "Org A",
          fileorgname: "file_a.pdf",
          category_id: BigInt(1),
          url: "https://example.com/alpha",
          description: "Alpha description",
          living_lab: { id: BigInt(1), name: "Geneva Lab" },
          kpidefinition: { id: BigInt(1), name: "KPI 1" },
          project: { id: BigInt(1), name: "Project A" },
        },
        {
          id: BigInt(2),
          name: "Beta Resource",
          orgname: "Org B",
          fileorgname: "file_b.pdf",
          category_id: BigInt(2),
          url: "https://example.com/beta",
          description: "Beta description",
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
        {
          id: BigInt(3),
          name: "Gamma Resource",
          orgname: "Org C",
          fileorgname: "file_c.pdf",
          category_id: BigInt(1),
          url: "https://example.com/gamma",
          description: "Gamma description",
          living_lab: { id: BigInt(2), name: "Paris Lab" },
          kpidefinition: null,
          project: { id: BigInt(2), name: "Project B" },
        },
      ];

      getItemsSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request("http://localhost:3000/api/v1/items", {
        method: "GET",
      });

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toHaveLength(3);
      expect(getItemsSpy).toHaveBeenCalledWith(undefined);

      // Verify items are ordered by name
      const names = responseData.map((item: any) => item.name);
      expect(names).toEqual([
        "Alpha Resource",
        "Beta Resource",
        "Gamma Resource",
      ]);
    });

    it("should include related living_lab, kpidefinition, and project data", async () => {
      // Arrange
      const mockItems = [
        {
          id: BigInt(1),
          name: "Resource With Relations",
          orgname: "Org A",
          fileorgname: "file.pdf",
          category_id: BigInt(1),
          url: "https://example.com/resource",
          description: "Resource with all relations",
          living_lab: {
            id: BigInt(1),
            name: "Geneva Lab",
            country: "Switzerland",
          },
          kpidefinition: {
            id: BigInt(1),
            kpi_number: "KPI-001",
            name: "Air Quality",
          },
          project: { id: BigInt(1), name: "SUM Project", type: "research" },
        },
      ];

      getItemsSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request("http://localhost:3000/api/v1/items", {
        method: "GET",
      });

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData[0].living_lab).toBeDefined();
      expect(responseData[0].living_lab.name).toBe("Geneva Lab");
      expect(responseData[0].kpidefinition).toBeDefined();
      expect(responseData[0].kpidefinition.name).toBe("Air Quality");
      expect(responseData[0].project).toBeDefined();
      expect(responseData[0].project.name).toBe("SUM Project");
    });

    it("should return empty array when no items exist", async () => {
      // Arrange
      getItemsSpy.mockResolvedValue([]);

      mockContext.request = new Request("http://localhost:3000/api/v1/items", {
        method: "GET",
      });

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual([]);
    });
  });

  describe("Happy path - Filter by single category_id", () => {
    it("should return only items with category_id=1 ordered by name", async () => {
      // Arrange
      const mockItems = [
        {
          id: BigInt(1),
          name: "Alpha Resource",
          orgname: "Org A",
          fileorgname: "file_a.pdf",
          category_id: BigInt(1),
          url: "https://example.com/alpha",
          description: "Alpha description",
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
        {
          id: BigInt(3),
          name: "Gamma Resource",
          orgname: "Org C",
          fileorgname: "file_c.pdf",
          category_id: BigInt(1),
          url: "https://example.com/gamma",
          description: "Gamma description",
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
      ];

      getItemsSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_id=1",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toHaveLength(2);
      expect(getItemsSpy).toHaveBeenCalledWith([1]);

      // All items should have category_id = 1
      responseData.forEach((item: any) => {
        expect(Number(item.category_id)).toBe(1);
      });

      // Verify items are ordered by name
      const names = responseData.map((item: any) => item.name);
      expect(names).toEqual(["Alpha Resource", "Gamma Resource"]);
    });

    it("should filter by category_id=2", async () => {
      // Arrange
      const mockItems = [
        {
          id: BigInt(2),
          name: "Beta Resource",
          orgname: "Org B",
          fileorgname: "file_b.pdf",
          category_id: BigInt(2),
          url: "https://example.com/beta",
          description: "Beta description",
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
      ];

      getItemsSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_id=2",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toHaveLength(1);
      expect(getItemsSpy).toHaveBeenCalledWith([2]);
      expect(Number(responseData[0].category_id)).toBe(2);
    });
  });

  describe("Happy path - Filter by multiple category_ids", () => {
    it("should return items with category_id=1 or category_id=2 ordered by name", async () => {
      // Arrange
      const mockItems = [
        {
          id: BigInt(1),
          name: "Alpha Resource",
          orgname: "Org A",
          fileorgname: "file_a.pdf",
          category_id: BigInt(1),
          url: "https://example.com/alpha",
          description: "Alpha description",
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
        {
          id: BigInt(2),
          name: "Beta Resource",
          orgname: "Org B",
          fileorgname: "file_b.pdf",
          category_id: BigInt(2),
          url: "https://example.com/beta",
          description: "Beta description",
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
        {
          id: BigInt(3),
          name: "Gamma Resource",
          orgname: "Org C",
          fileorgname: "file_c.pdf",
          category_id: BigInt(1),
          url: "https://example.com/gamma",
          description: "Gamma description",
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
      ];

      getItemsSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_id=[1,2]",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toHaveLength(3);
      expect(getItemsSpy).toHaveBeenCalledWith([1, 2]);

      // All items should have category_id = 1 or 2
      responseData.forEach((item: any) => {
        expect([1, 2]).toContain(Number(item.category_id));
      });

      // Verify items are ordered by name
      const names = responseData.map((item: any) => item.name);
      expect(names).toEqual([
        "Alpha Resource",
        "Beta Resource",
        "Gamma Resource",
      ]);
    });

    it("should handle multiple category_ids with comma-separated format", async () => {
      // Arrange
      const mockItems = [
        {
          id: BigInt(1),
          name: "Resource 1",
          orgname: "Org A",
          fileorgname: "file.pdf",
          category_id: BigInt(1),
          url: null,
          description: null,
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
      ];

      getItemsSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_id=1,2,3",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(getItemsSpy).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe("Error cases - Unknown category_id", () => {
    it("should return empty list when category_id is invalid string 'XXX'", async () => {
      // Arrange
      getItemsSpy.mockResolvedValue([]);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_id=XXX",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual([]);
    });

    it("should return empty list when category_id does not exist in database", async () => {
      // Arrange
      getItemsSpy.mockResolvedValue([]);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_id=99999",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual([]);
    });

    it("should return empty list when category_id array contains only invalid values", async () => {
      // Arrange
      getItemsSpy.mockResolvedValue([]);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_id=[abc,xyz]",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual([]);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty category_id parameter gracefully", async () => {
      // Arrange
      const mockItems = [
        {
          id: BigInt(1),
          name: "Resource",
          orgname: "Org",
          fileorgname: "file.pdf",
          category_id: BigInt(1),
          url: null,
          description: null,
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
      ];

      getItemsSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_id=",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert - empty string should be treated as no filter
      expect(response.status).toBe(200);
      expect(getItemsSpy).toHaveBeenCalledWith(undefined);
    });

    it("should handle mixed valid and invalid category_ids by filtering only valid ones", async () => {
      // Arrange
      const mockItems = [
        {
          id: BigInt(1),
          name: "Resource",
          orgname: "Org",
          fileorgname: "file.pdf",
          category_id: BigInt(1),
          url: null,
          description: null,
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
      ];

      getItemsSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_id=[1,abc,2]",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert - only valid numbers should be used for filtering
      expect(response.status).toBe(200);
      expect(getItemsSpy).toHaveBeenCalledWith([1, 2]);
    });
  });
});

describe("GET /api/v1/items - Retrieve items by category type", () => {
  let mockContext: Partial<APIContext>;
  let getItemsByCategoryTypeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockContext = {
      request: new Request("http://localhost:3000/api/v1/items", {
        method: "GET",
      }),
      locals: {},
    } as Partial<APIContext>;

    getItemsByCategoryTypeSpy = vi.spyOn(
      ItemService.prototype,
      "getItemsByCategoryType",
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Happy path - Filter by category_type", () => {
    it("should return items matching category_type='RESOURCES' ordered by name", async () => {
      // Arrange - categories with type="RESOURCES" have ids 1 and 2
      const mockItems = [
        {
          id: BigInt(1),
          name: "Alpha Resource",
          orgname: "Org A",
          fileorgname: "file_a.pdf",
          category_id: BigInt(1),
          url: "https://example.com/alpha",
          description: "Alpha description",
          living_lab: { id: BigInt(1), name: "Geneva Lab" },
          kpidefinition: null,
          project: null,
        },
        {
          id: BigInt(2),
          name: "Beta Resource",
          orgname: "Org B",
          fileorgname: "file_b.pdf",
          category_id: BigInt(2),
          url: "https://example.com/beta",
          description: "Beta description",
          living_lab: null,
          kpidefinition: null,
          project: null,
        },
        {
          id: BigInt(3),
          name: "Gamma Resource",
          orgname: "Org C",
          fileorgname: "file_c.pdf",
          category_id: BigInt(1),
          url: "https://example.com/gamma",
          description: "Gamma description",
          living_lab: null,
          kpidefinition: null,
          project: { id: BigInt(1), name: "Project A" },
        },
      ];

      getItemsByCategoryTypeSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_type=RESOURCES",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toHaveLength(3);
      expect(getItemsByCategoryTypeSpy).toHaveBeenCalledWith("RESOURCES");

      // Verify items are ordered by name
      const names = responseData.map((item: any) => item.name);
      expect(names).toEqual([
        "Alpha Resource",
        "Beta Resource",
        "Gamma Resource",
      ]);
    });

    it("should return items for category_type with single matching category", async () => {
      // Arrange - category_type="KPIS" has only one category with id=3
      const mockItems = [
        {
          id: BigInt(10),
          name: "KPI Document",
          orgname: "Org KPI",
          fileorgname: "kpi.pdf",
          category_id: BigInt(3),
          url: "https://example.com/kpi",
          description: "KPI resource",
          living_lab: null,
          kpidefinition: { id: BigInt(1), name: "Air Quality" },
          project: null,
        },
      ];

      getItemsByCategoryTypeSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_type=KPIS",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toHaveLength(1);
      expect(getItemsByCategoryTypeSpy).toHaveBeenCalledWith("KPIS");
    });

    it("should include related living_lab, kpidefinition, and project data when filtering by category_type", async () => {
      // Arrange
      const mockItems = [
        {
          id: BigInt(1),
          name: "Complete Resource",
          orgname: "Org A",
          fileorgname: "file.pdf",
          category_id: BigInt(1),
          url: "https://example.com/complete",
          description: "Resource with all relations",
          living_lab: {
            id: BigInt(1),
            name: "Geneva Lab",
            country: "Switzerland",
          },
          kpidefinition: {
            id: BigInt(1),
            kpi_number: "KPI-001",
            name: "Air Quality",
          },
          project: { id: BigInt(1), name: "SUM Project", type: "research" },
        },
      ];

      getItemsByCategoryTypeSpy.mockResolvedValue(mockItems);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_type=RESOURCES",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData[0].living_lab).toBeDefined();
      expect(responseData[0].living_lab.name).toBe("Geneva Lab");
      expect(responseData[0].kpidefinition).toBeDefined();
      expect(responseData[0].kpidefinition.name).toBe("Air Quality");
      expect(responseData[0].project).toBeDefined();
      expect(responseData[0].project.name).toBe("SUM Project");
    });

    it("should return empty array when no items exist for valid category_type", async () => {
      // Arrange
      getItemsByCategoryTypeSpy.mockResolvedValue([]);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_type=RESOURCES",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual([]);
    });
  });

  describe("Error cases - Unknown category_type", () => {
    it("should return 404 when category_type does not exist", async () => {
      // Arrange
      getItemsByCategoryTypeSpy.mockResolvedValue(null);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_type=XXX",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(responseData.error).toBeDefined();
    });
  });

  describe("Edge cases - category_type parameter handling", () => {
    it("should handle category_type with lowercase by treating it case-sensitively", async () => {
      // Arrange - "resources" lowercase should not match "RESOURCES"
      getItemsByCategoryTypeSpy.mockResolvedValue(null);

      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items?category_type=resources",
        { method: "GET" },
      );

      // Act
      const response = await GET(mockContext as APIContext);

      // Assert - should return 404 as no category with type="resources" exists
      expect(response.status).toBe(404);
    });
  });
});

// =============================================================================
// GET /api/v1/items/:id - Retrieve item by ID
// =============================================================================

describe("GET /api/v1/items/:id - Retrieve item by ID", () => {
  let mockContext: Partial<APIContext>;
  let getItemByIdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockContext = {
      request: new Request("http://localhost:3000/api/v1/items/1", {
        method: "GET",
      }),
      params: { id: "1" },
      locals: {},
    } as Partial<APIContext>;

    getItemByIdSpy = vi.spyOn(ItemService.prototype, "getItemById");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Happy path - Retrieve item by ID", () => {
    it("should return item with given id", async () => {
      // Arrange
      const mockItem = {
        id: BigInt(1),
        name: "Alpha Resource",
        orgname: "Org A",
        fileorgname: "file_a.pdf",
        category_id: BigInt(1),
        url: "https://example.com/alpha",
        description: "Alpha description",
        living_lab: {
          id: BigInt(1),
          name: "Geneva Lab",
          country: "Switzerland",
        },
        kpidefinition: {
          id: BigInt(1),
          kpi_number: "KPI-001",
          name: "Air Quality",
        },
        project: { id: BigInt(1), name: "SUM Project", type: "research" },
        item_tag: [
          {
            id: 1,
            item_id: BigInt(1),
            tag_id: BigInt(1),
            tags: { id: BigInt(1), name: "sustainability", color: "#22c55e" },
          },
          {
            id: 2,
            item_id: BigInt(1),
            tag_id: BigInt(2),
            tags: { id: BigInt(2), name: "mobility", color: "#3b82f6" },
          },
        ],
      };

      getItemByIdSpy.mockResolvedValue(mockItem);

      mockContext.params = { id: "1" };
      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items/1",
        {
          method: "GET",
        },
      );

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.id).toBeDefined();
      expect(responseData.name).toBe("Alpha Resource");
      expect(getItemByIdSpy).toHaveBeenCalledWith(1);
    });

    it("should include related living_lab data", async () => {
      // Arrange
      const mockItem = {
        id: BigInt(1),
        name: "Resource With Lab",
        orgname: "Org A",
        fileorgname: "file.pdf",
        category_id: BigInt(1),
        url: "https://example.com/resource",
        description: "Resource description",
        living_lab: {
          id: BigInt(1),
          name: "Geneva Lab",
          country: "Switzerland",
          lat: "46.2044",
          lng: "6.1432",
        },
        kpidefinition: null,
        project: null,
        item_tag: [],
      };

      getItemByIdSpy.mockResolvedValue(mockItem);

      mockContext.params = { id: "1" };
      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items/1",
        {
          method: "GET",
        },
      );

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.living_lab).toBeDefined();
      expect(responseData.living_lab.name).toBe("Geneva Lab");
      expect(responseData.living_lab.country).toBe("Switzerland");
    });

    it("should include related kpidefinition data", async () => {
      // Arrange
      const mockItem = {
        id: BigInt(2),
        name: "KPI Resource",
        orgname: "Org B",
        fileorgname: "kpi.pdf",
        category_id: BigInt(1),
        url: "https://example.com/kpi-resource",
        description: "Resource about KPIs",
        living_lab: null,
        kpidefinition: {
          id: BigInt(1),
          kpi_number: "KPI-001",
          name: "Air Quality",
          type: "environmental",
          description: "Measures air quality",
        },
        project: null,
        item_tag: [],
      };

      getItemByIdSpy.mockResolvedValue(mockItem);

      mockContext.params = { id: "2" };
      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items/2",
        {
          method: "GET",
        },
      );

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.kpidefinition).toBeDefined();
      expect(responseData.kpidefinition.name).toBe("Air Quality");
      expect(responseData.kpidefinition.kpi_number).toBe("KPI-001");
    });

    it("should include related project data", async () => {
      // Arrange
      const mockItem = {
        id: BigInt(3),
        name: "Project Resource",
        orgname: "Org C",
        fileorgname: "project.pdf",
        category_id: BigInt(1),
        url: "https://example.com/project-resource",
        description: "Resource about project",
        living_lab: null,
        kpidefinition: null,
        project: {
          id: BigInt(1),
          name: "SUM Project",
          type: "research",
          description: "Sustainable Urban Mobility",
        },
        item_tag: [],
      };

      getItemByIdSpy.mockResolvedValue(mockItem);

      mockContext.params = { id: "3" };
      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items/3",
        {
          method: "GET",
        },
      );

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.project).toBeDefined();
      expect(responseData.project.name).toBe("SUM Project");
      expect(responseData.project.type).toBe("research");
    });

    it("should include related item_tags data", async () => {
      // Arrange
      const mockItem = {
        id: BigInt(4),
        name: "Tagged Resource",
        orgname: "Org D",
        fileorgname: "tagged.pdf",
        category_id: BigInt(1),
        url: "https://example.com/tagged-resource",
        description: "Resource with tags",
        living_lab: null,
        kpidefinition: null,
        project: null,
        item_tag: [
          {
            id: 1,
            item_id: BigInt(4),
            tag_id: BigInt(1),
            tags: { id: BigInt(1), name: "sustainability", color: "#22c55e" },
          },
          {
            id: 2,
            item_id: BigInt(4),
            tag_id: BigInt(2),
            tags: { id: BigInt(2), name: "mobility", color: "#3b82f6" },
          },
          {
            id: 3,
            item_id: BigInt(4),
            tag_id: BigInt(3),
            tags: { id: BigInt(3), name: "urban", color: "#f59e0b" },
          },
        ],
      };

      getItemByIdSpy.mockResolvedValue(mockItem);

      mockContext.params = { id: "4" };
      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items/4",
        {
          method: "GET",
        },
      );

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.item_tag).toBeDefined();
      expect(responseData.item_tag).toHaveLength(3);
      expect(responseData.item_tag[0].tags.name).toBe("sustainability");
      expect(responseData.item_tag[1].tags.name).toBe("mobility");
      expect(responseData.item_tag[2].tags.name).toBe("urban");
    });

    it("should include all related data when item has all relations", async () => {
      // Arrange
      const mockItem = {
        id: BigInt(5),
        name: "Complete Resource",
        orgname: "Org E",
        fileorgname: "complete.pdf",
        category_id: BigInt(1),
        url: "https://example.com/complete-resource",
        description: "Resource with all relations",
        living_lab: {
          id: BigInt(1),
          name: "Geneva Lab",
          country: "Switzerland",
        },
        kpidefinition: {
          id: BigInt(1),
          kpi_number: "KPI-001",
          name: "Air Quality",
        },
        project: { id: BigInt(1), name: "SUM Project", type: "research" },
        item_tag: [
          {
            id: 1,
            item_id: BigInt(5),
            tag_id: BigInt(1),
            tags: { id: BigInt(1), name: "sustainability", color: "#22c55e" },
          },
        ],
      };

      getItemByIdSpy.mockResolvedValue(mockItem);

      mockContext.params = { id: "5" };
      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items/5",
        {
          method: "GET",
        },
      );

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.living_lab).toBeDefined();
      expect(responseData.kpidefinition).toBeDefined();
      expect(responseData.project).toBeDefined();
      expect(responseData.item_tag).toBeDefined();
      expect(responseData.item_tag).toHaveLength(1);
    });
  });

  describe("Error cases - Item not found", () => {
    it("should return 404 when item id does not exist", async () => {
      // Arrange
      getItemByIdSpy.mockResolvedValue(null);

      mockContext.params = { id: "999" };
      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items/999",
        {
          method: "GET",
        },
      );

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(responseData.error).toBeDefined();
      expect(getItemByIdSpy).toHaveBeenCalledWith(999);
    });

    it("should return 404 when item id is 0", async () => {
      // Arrange
      getItemByIdSpy.mockResolvedValue(null);

      mockContext.params = { id: "0" };
      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items/0",
        {
          method: "GET",
        },
      );

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(responseData.error).toBeDefined();
    });
  });

  describe("Edge cases - Invalid id parameter", () => {
    it("should return 400 when id is not a valid number", async () => {
      // Arrange
      mockContext.params = { id: "abc" };
      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items/abc",
        {
          method: "GET",
        },
      );

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.error).toBeDefined();
    });

    it("should return 400 when id is negative", async () => {
      // Arrange
      mockContext.params = { id: "-1" };
      mockContext.request = new Request(
        "http://localhost:3000/api/v1/items/-1",
        {
          method: "GET",
        },
      );

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.error).toBeDefined();
    });

    it("should return 400 when id is empty string", async () => {
      // Arrange
      mockContext.params = { id: "" };
      mockContext.request = new Request("http://localhost:3000/api/v1/items/", {
        method: "GET",
      });

      // Act
      const { GET: GET_BY_ID } = await import("./[id]");
      const response = await GET_BY_ID(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.error).toBeDefined();
    });
  });
});
