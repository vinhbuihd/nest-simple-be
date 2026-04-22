import { UpdatePostDto } from './dto/update-post.dto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { CacheService } from '../cache/cache.service';
import { PostsQueueProducer } from '../queue/posts-queue.producer';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly postsQueueProducer: PostsQueueProducer,
  ) {}

  private getPostsCacheKey(query: ListPostsQueryDto): string {
    const search = query.search ?? '';
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder;
    return `posts:list:page=${query.page}:limit=${query.limit}:search=${search}:sortBy=${sortBy}:sortOrder=${sortOrder}`;
  }

  private async invalidatePostsCache(): Promise<void> {
    await this.cacheService.delByPattern('posts:list:*');
  }

  async create(authorId: string, createPostDto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    await this.invalidatePostsCache();
    await this.postsQueueProducer.addSendEmailJob(post.id);

    return post;
  }

  async update(id: string, authorId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    await this.invalidatePostsCache();

    return updatedPost;
  }

  async findAll(query: ListPostsQueryDto) {
    const page = query.page;
    const limit = query.limit;

    const cacheKey = this.getPostsCacheKey(query);
    const cachedPosts = await this.cacheService.get(cacheKey);

    if (cachedPosts) return cachedPosts;

    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { content: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const orderBy: Prisma.PostOrderByWithRelationInput = {
      [query.sortBy]: query.sortOrder,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),

      this.prisma.post.count({ where }),
    ]);

    const result = {
      items,
      meta: {
        total,
        page,
        limit,
      },
    };

    await this.cacheService.set(cacheKey, result, 60); // Cache for 60 seconds

    return result;
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }
  async remove(id: string, authorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    await this.invalidatePostsCache();

    return {
      deleted: true,
    };
  }
}
