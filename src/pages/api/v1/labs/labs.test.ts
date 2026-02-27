import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from ".";
import type { APIContext } from "astro";
import { LabService } from "../../../../bff/services/labs.service";
import { UserService } from "../../../../bff/services/user.service";

describe("POST /api/v1/labs - Create new lab", () => {
  let mockContext: Partial<APIContext>;
  let createLabSpy: any;
  let setUserLivingLabSpy: any;

  beforeEach(() => {
    // Reset mocks before each test
    mockContext = {
      request: new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }),
      locals: {},
    } as Partial<APIContext>;

    // Spy on LabService.prototype.createLab
    createLabSpy = vi.spyOn(LabService.prototype, "createLab");

    // Spy on UserService.prototype.setUserLivingLab
    setUserLivingLabSpy = vi.spyOn(UserService.prototype, "setUserLivingLab");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Happy path - Authenticated user creates new lab", () => {
    it("should create a new lab when authenticated user provides valid data", async () => {
      // Arrange - authenticated user in context
      mockContext.locals = {
        user: {
          id: "1",
          email: "admin@example.com",
          name: "Admin User",
          role_id: 1,
          status: "active",
        },
      };

      const newLabData = {
        name: "Paris Living Lab",
        country: "France",
        country_code2: "FR",
        description: "A living lab for urban mobility in Paris",
        population: 2165000,
        area: 105.4,
        lat: "48.8566",
        lng: "2.3522",
      };

      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLabData),
      });

      // Mock service responses
      const mockCreatedLab = {
        id: "1",
        ...newLabData,
        created_at: new Date(),
        updated_at: new Date(),
      };
      createLabSpy.mockResolvedValue(mockCreatedLab);

      const mockUpdatedUser = {
        id: 1,
        email: "admin@example.com",
        living_lab_id: "1",
      };
      setUserLivingLabSpy.mockResolvedValue(mockUpdatedUser);

      // Act
      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseData.id).toBeDefined();
      expect(responseData.name).toBe(newLabData.name);
      expect(responseData.country).toBe(newLabData.country);
      expect(responseData.user_id).toBe(1);
      expect(createLabSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: newLabData.name,
        }),
      );
      expect(setUserLivingLabSpy).toHaveBeenCalledWith("1", "1");
    });

    it("should assign authenticated user_id to the newly created lab", async () => {
      const userId = "42";
      mockContext.locals = {
        user: {
          id: userId,
          email: "creator@example.com",
          name: "Lab Creator",
          role_id: 1,
          status: "active",
        },
      };

      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "User Assignment Lab" }),
      });

      const mockCreatedLab = {
        id: "123",
        name: "User Assignment Lab",
        created_at: new Date(),
        updated_at: new Date(),
      };
      createLabSpy.mockResolvedValue(mockCreatedLab);

      const mockUpdatedUser = {
        id: 42,
        email: "creator@example.com",
        living_lab_id: "123",
      };
      setUserLivingLabSpy.mockResolvedValue(mockUpdatedUser);

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.user_id).toBe(Number(userId));
      expect(setUserLivingLabSpy).toHaveBeenCalledWith(userId, "123");
    });

    it("should return newly created lab with all provided fields", async () => {
      mockContext.locals = {
        user: {
          id: "1",
          email: "admin@example.com",
          name: "Admin",
          role_id: 1,
          status: "active",
        },
      };

      const completeLabData = {
        name: "Complete Lab",
        country: "Spain",
        country_code2: "ES",
        description: "Full data lab",
        population: 500000,
        area: 150.5,
        radius: 25.3,
        lat: "41.3851",
        lng: "2.1734",
        flag: "🇪🇸",
      };

      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeLabData),
      });

      const mockCreatedLab = {
        id: "456",
        ...completeLabData,
        created_at: new Date(),
        updated_at: new Date(),
      };
      createLabSpy.mockResolvedValue(mockCreatedLab);

      const mockUpdatedUser = {
        id: 1,
        email: "admin@example.com",
        living_lab_id: "456",
      };
      setUserLivingLabSpy.mockResolvedValue(mockUpdatedUser);

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.name).toBe(completeLabData.name);
      expect(responseData.country).toBe(completeLabData.country);
      expect(responseData.country_code2).toBe(completeLabData.country_code2);
      expect(responseData.description).toBe(completeLabData.description);
      expect(responseData.population).toBe(completeLabData.population);
      expect(responseData.area).toBe(completeLabData.area);
      expect(responseData.radius).toBe(completeLabData.radius);
    });

    it("should set created_at timestamp when lab is created", async () => {
      mockContext.locals = {
        user: {
          id: "1",
          email: "admin@example.com",
          name: "Admin",
          role_id: 1,
          status: "active",
        },
      };

      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Timestamp Lab" }),
      });

      const beforeCreate = new Date();
      const createdAt = new Date();
      const mockCreatedLab = {
        id: "789",
        name: "Timestamp Lab",
        created_at: createdAt,
        updated_at: createdAt,
      };
      createLabSpy.mockResolvedValue(mockCreatedLab);

      const mockUpdatedUser = {
        id: 1,
        email: "admin@example.com",
        living_lab_id: "789",
      };
      setUserLivingLabSpy.mockResolvedValue(mockUpdatedUser);

      const response = await POST(mockContext as APIContext);
      const afterCreate = new Date();
      const responseData = await response.json();

      expect(responseData.created_at).toBeDefined();
      const returnedCreatedAt = new Date(responseData.created_at);
      expect(returnedCreatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(returnedCreatedAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });
  });

  describe("Error cases - Authentication and authorization", () => {
    it("should return 401 when user is not authenticated", async () => {
      // No user in context.locals
      mockContext.locals = {};

      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Unauthorized Lab" }),
      });

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("Unauthorized");
    });

    it("should return 401 when user is null", async () => {
      mockContext.locals = {
        user: null as any,
      };

      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "No User Lab" }),
      });

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
    });

    it("should return 401 when user is undefined", async () => {
      mockContext.locals = {
        user: undefined,
      };

      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Undefined User Lab" }),
      });

      const response = await POST(mockContext as APIContext);

      expect(response.status).toBe(401);
    });

    it("should return 403 when user account is disabled", async () => {
      mockContext.locals = {
        user: {
          id: "99",
          email: "disabled@example.com",
          name: "Disabled User",
          role_id: 2,
          status: "disabled",
        },
      };

      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Disabled User Lab" }),
      });

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("Forbidden");
    });
  });

  describe("Error cases - Invalid input validation", () => {
    beforeEach(() => {
      mockContext.locals = {
        user: {
          id: "1",
          email: "admin@example.com",
          name: "Admin",
          role_id: 1,
          status: "active",
        },
      };
    });

    it("should return 400 when name is missing", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country: "France" }),
      });

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.toLowerCase()).toContain("name");
    });

    it("should return 400 when name is empty string", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "" }),
      });

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.toLowerCase()).toContain("name");
    });

    it("should return 400 when name is too short (less than 2 characters)", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "A" }),
      });

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain("2 characters");
    });

    it("should return 400 when name is only whitespace", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "   " }),
      });

      const response = await POST(mockContext as APIContext);

      expect(response.status).toBe(400);
    });

    it("should return 400 when country_code2 is not 2 characters", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Valid Lab",
          country_code2: "FRA", // Should be 2 chars
        }),
      });

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain("country_code2");
    });

    it("should return 400 when population is negative", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Valid Lab",
          population: -1000,
        }),
      });

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain("population");
    });

    it("should return 400 when area is negative", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Valid Lab",
          area: -50.5,
        }),
      });

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain("area");
    });

    it("should return 400 when radius is negative", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Valid Lab",
          radius: -10,
        }),
      });

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain("radius");
    });

    it("should return 400 when request body is not valid JSON", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json{",
      });

      const response = await POST(mockContext as APIContext);

      expect(response.status).toBe(400);
    });

    it("should return 400 when request body is empty", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "",
      });

      const response = await POST(mockContext as APIContext);

      expect(response.status).toBe(400);
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {
      mockContext.locals = {
        user: {
          id: "1",
          email: "admin@example.com",
          name: "Admin",
          role_id: 1,
          status: "active",
        },
      };
    });

    it("should handle special characters in lab name", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Lab Côte d'Azur - Région PACA (2025)",
        }),
      });

      const mockCreatedLab = {
        id: "999",
        name: "Lab Côte d'Azur - Région PACA (2025)",
        created_at: new Date(),
        updated_at: new Date(),
      };
      createLabSpy.mockResolvedValue(mockCreatedLab);

      const mockUpdatedUser = {
        id: 1,
        email: "admin@example.com",
        living_lab_id: "999",
      };
      setUserLivingLabSpy.mockResolvedValue(mockUpdatedUser);

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.name).toBe("Lab Côte d'Azur - Région PACA (2025)");
    });

    it("should accept zero as valid population value", async () => {
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Empty Lab",
          population: 0,
        }),
      });

      const mockCreatedLab = {
        id: "888",
        name: "Empty Lab",
        population: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      createLabSpy.mockResolvedValue(mockCreatedLab);

      const mockUpdatedUser = {
        id: 1,
        email: "admin@example.com",
        living_lab_id: "888",
      };
      setUserLivingLabSpy.mockResolvedValue(mockUpdatedUser);

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.population).toBe(0);
    });

    it("should handle very long lab names", async () => {
      const longName = "A".repeat(255);
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: longName }),
      });

      const mockCreatedLab = {
        id: "777",
        name: longName,
        created_at: new Date(),
        updated_at: new Date(),
      };
      createLabSpy.mockResolvedValue(mockCreatedLab);

      const mockUpdatedUser = {
        id: 1,
        email: "admin@example.com",
        living_lab_id: "777",
      };
      setUserLivingLabSpy.mockResolvedValue(mockUpdatedUser);

      const response = await POST(mockContext as APIContext);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.name).toBe(longName);
    });

    it("should handle concurrent lab creation by same user", async () => {
      const lab1Data = { name: "Concurrent Lab 1" };
      const lab2Data = { name: "Concurrent Lab 2" };

      const request1 = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lab1Data),
      });

      const request2 = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lab2Data),
      });

      const context1 = { ...mockContext, request: request1 };
      const context2 = { ...mockContext, request: request2 };

      const mockCreatedLab1 = {
        id: "111",
        name: "Concurrent Lab 1",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockCreatedLab2 = {
        id: "222",
        name: "Concurrent Lab 2",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockUpdatedUser = {
        id: 1,
        email: "admin@example.com",
        living_lab_id: "111",
      };

      createLabSpy
        .mockResolvedValueOnce(mockCreatedLab1)
        .mockResolvedValueOnce(mockCreatedLab2);

      setUserLivingLabSpy.mockResolvedValue(mockUpdatedUser);

      const [response1, response2] = await Promise.all([
        POST(context1 as APIContext),
        POST(context2 as APIContext),
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.id).not.toBe(data2.id);
      expect(data1.name).toBe("Concurrent Lab 1");
      expect(data2.name).toBe("Concurrent Lab 2");
    });

    it("should allow multiple labs with same name for different users", async () => {
      const labName = "Duplicate Name Lab";

      // First user creates lab
      mockContext.locals = {
        user: {
          id: "1",
          email: "user1@example.com",
          name: "User 1",
          role_id: 1,
          status: "active",
        },
      };
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: labName }),
      });

      const mockCreatedLab1 = {
        id: "333",
        name: labName,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockUpdatedUser1 = {
        id: 1,
        email: "user1@example.com",
        living_lab_id: "333",
      };
      createLabSpy.mockResolvedValueOnce(mockCreatedLab1);
      setUserLivingLabSpy.mockResolvedValueOnce(mockUpdatedUser1);

      const response1 = await POST(mockContext as APIContext);
      expect(response1.status).toBe(201);

      // Second user creates lab with same name
      mockContext.locals = {
        user: {
          id: "2",
          email: "user2@example.com",
          name: "User 2",
          role_id: 1,
          status: "active",
        },
      };
      mockContext.request = new Request("http://localhost:3000/api/v1/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: labName }),
      });

      const mockCreatedLab2 = {
        id: "444",
        name: labName,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockUpdatedUser2 = {
        id: 2,
        email: "user2@example.com",
        living_lab_id: "444",
      };
      createLabSpy.mockResolvedValueOnce(mockCreatedLab2);
      setUserLivingLabSpy.mockResolvedValueOnce(mockUpdatedUser2);

      const response2 = await POST(mockContext as APIContext);
      expect(response2.status).toBe(201);

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.user_id).toBe(1);
      expect(data2.user_id).toBe(2);
      expect(data1.id).not.toBe(data2.id);
    });
  });
});
