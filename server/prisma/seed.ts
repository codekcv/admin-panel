/* eslint-disable no-await-in-loop */
import { Customer, Item, ItemInOrder, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import faker from 'faker';
import { nanoid } from 'nanoid';

const main = async (): Promise<void> => {
  const prisma = new PrismaClient();

  try {
    // Admin
    await prisma.admin.upsert({
      where: {
        email: 'lorem@ipsum.com',
      },
      create: {
        email: 'lorem@ipsum.com',
        firstName: 'Lorem',
        lastName: 'Ipsum',
        username: 'demo1user',
        passwordHash: await bcrypt.hash('demo1pass', 10),
      },
      update: { passwordHash: await bcrypt.hash('demo1pass', 10) },
    });

    // Item Views
    const items: Item[] = [];

    for (let i = 0; i < 10; i += 1) {
      const id = nanoid();

      const item = await prisma.item.upsert({
        where: { id },
        create: {
          id,
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: parseFloat(faker.commerce.price()),
        },
        update: {},
      });

      items.push(item);
    }

    // Customers
    const customers: Customer[] = [];

    for (let i = 0; i < 1; i += 1) {
      const id = nanoid();

      const customer = await prisma.customer.upsert({
        where: { id },
        create: {
          id,
          username: faker.internet.userName(),
          passwordHash: await bcrypt.hash(faker.internet.password(), 10),
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          email: faker.internet.email(),
          age: Math.floor(Math.random() * (60 - 10) + 10),
        },
        update: {},
      });

      customers.push(customer);
    }

    // Orders
    for (let i = 0; i < 2; i += 1) {
      const id = nanoid();
      const manyItems: Omit<ItemInOrder, 'orderId'>[] = [];
      let orderTotal = 0;

      for (let j = 0; j < 5; j += 1) {
        const item = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const total = quantity * item.price;

        orderTotal += total;

        manyItems.push({
          id: nanoid(),
          itemViewId: item.id,
          quantity,
          total,
        });
      }

      await prisma.order.upsert({
        where: { id },
        create: {
          id,
          referenceId: nanoid(8).toUpperCase(),
          address: `${faker.address.zipCode()} ${faker.address.cityName()} ${faker.address.streetName()}`,
          status: 'ORDERED',
          total: orderTotal,
          orderDate: new Date(faker.datatype.datetime().toISOString()),
          itemsInOrder: {
            createMany: {
              data: manyItems,
            },
          },
          customer: {
            connect: {
              id: customers[0].id,
            },
          },
        },
        update: {},
      });
    }
  } catch (error) {
    throw new Error(error);
  } finally {
    prisma.$disconnect();
  }
};

main();
