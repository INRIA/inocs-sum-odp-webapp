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
