import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { request, Request, Response } from "express";
import z from "zod";

const CategoriesEnum = z.enum([
  "food",
  "others",
  "services",
  "transport",
  "accommodation",
]);

export class RefundsController {
  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      name: z
        .string()
        .trim()
        .min(1, { message: "Informe o nome da solicitação" }),
      category: CategoriesEnum,
      amount: z
        .number()
        .positive({ message: "O valor precisa ser maior que zero" }),
      filename: z.string(),
    });

    const { name, category, amount, filename } = bodySchema.parse(req.body);

    if (!req.user?.id) throw new AppError("Unauthorized", 401);

    const refund = await prisma.refunds.create({
      data: {
        name,
        category,
        amount,
        filename,
        userId: req.user.id,
      },
    });

    res.status(201).json();
  }

  async get(req: Request, res: Response) {
    const querySchema = z.object({
      name: z.string().optional().default(""),
      page: z.coerce.number().optional().default(1),
      perPage: z.coerce.number().optional().default(10),
    });

    const { name, page, perPage } = querySchema.parse(req.query);

    //Calcular os valores de skip
    const skip = (page - 1) * perPage;

    const refunds = await prisma.refunds.findMany({
      skip,
      take: perPage,
      where: {
        user: { name: { contains: name.trim() } },
      },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    //Obter o total de registros para calcular o número de páginas
    const totalRecords = await prisma.refunds.count({
      where: {
        user: { name: { contains: name.trim() } },
      },
    });

    const totalPages = Math.ceil(totalRecords / perPage);

    res.status(200).json({
      refunds,
      pagination: {
        page,
        perPage,
        totalRecords,
        totalPages: totalPages > 0 ? totalPages : 1,
      },
    });
  }

  async getRefundById(req: Request, res: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(req.params);

    const refund = await prisma.refunds.findFirst({
      where: { id },
      include: { user: true },
    });

    res.json(refund);
  }
}
