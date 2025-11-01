import moment from 'moment-timezone'
import { ObjectId } from 'mongodb'
import path from 'path'
import sharp from 'sharp'
import type { Express } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { NotificationTypes, PostStatus, PostTypes } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { POST_MESSAGE } from '~/constants/messages'
import { CreatePostBody } from '~/models/requests/post.request'
import CommentPostModel from '~/models/schemas/commentPost.schema'
import FollowModel from '~/models/schemas/follow.schema'
import ImagePostModel from '~/models/schemas/imagePost.schema'
import LikePostModel from '~/models/schemas/likePost.schema'
import NotificationModel from '~/models/schemas/notification.schema'
import PostModel from '~/models/schemas/post.schema'
import UserModel from '~/models/schemas/user.schema'
import MealPlanModel from '~/models/schemas/mealPlan.schema'
import { ErrorWithStatus } from '~/utils/error'
import { uploadFileToS3 } from '~/utils/s3'

class PostService {
  private sanitizeCategory(category?: string) {
    const fallback = 'posts'
    if (!category) return fallback
    const normalized = category
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\/-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-/]+|[-/]+$/g, '')
    return normalized || fallback
  }

  private buildImageKey(originalName: string, category: string) {
    const parsed = path.parse(originalName || 'image')
    const baseName = parsed.name.replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase() || 'image'
    const sanitizedCategory = this.sanitizeCategory(category)
    return `${sanitizedCategory}/${baseName}-${uuidv4()}.webp`
  }

  private async processAndUploadImage(file: Express.Multer.File, category?: string) {
    if (!file || !file.buffer) {
      throw new Error(POST_MESSAGE.UPLOAD_IMAGE_FAILED)
    }

    const key = this.buildImageKey(file.originalname, this.sanitizeCategory(category))
    const processedBuffer = await sharp(file.buffer)
      .rotate()
      .resize(1600, 1600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toBuffer()

    const uploadResult = (await uploadFileToS3({
      filename: key,
      contentType: 'image/webp',
      body: processedBuffer
    })) as { Location?: string }

    const location = uploadResult?.Location || `http://localhost:9000/cookhealthy/${key}`

    return {
      location,
      key
    }
  }

  async createPostService({ content = '', privacy, file = [], user_id }: CreatePostBody) {
    const newPost = await PostModel.create({
      content: content,
      status: Number(privacy),
      user_id: new ObjectId(user_id)
    })
    if (!newPost) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.NOT_CREATE_POST,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    //su dung sharp de resize mang hinh anh
    if (file?.length > 0) {
      try {
        const uploadedFiles = await Promise.all(
          file.map(async (item) => {
            const { location } = await this.processAndUploadImage(item, 'posts')
            return location
          })
        )

        const newImage = uploadedFiles.map((imageUrl) => ({
          url: imageUrl,
          post_id: newPost._id
        }))

        const images = await ImagePostModel.insertMany(newImage)
        return {
          post: newPost,
          image: images
        }
      } catch (error) {
        console.error('Error uploading files:', error)
        throw new ErrorWithStatus({
          message: POST_MESSAGE.UPLOAD_IMAGE_FAILED,
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR
        })
      }
    }
    return {
      post: newPost
    }
  }

  async uploadPostImageService(file: Express.Multer.File, category?: string) {
    const { location, key } = await this.processAndUploadImage(file, category)
    return {
      image_url: location,
      key
    }
  }
  async getPostService({ post_id, user_id }: { post_id: string; user_id: string }) {
    const post = await PostModel.aggregate([
      {
        // check neu la post cua user thi cho xem ca post private va public cua user do, con khong thi chi xem public
        $match: {
          _id: new ObjectId(post_id),
          is_banned: false,
          $or: [
            {
              status: PostStatus.publish
            },
            {
              status: PostStatus.following
            },
            {
              status: PostStatus.private,
              user_id: new ObjectId(user_id)
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'image_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'images'
        }
      },
      // lay url cua array anh
      {
        $addFields: {
          images: {
            $map: {
              input: '$images',
              as: 'image',
              in: '$$image.url'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'like_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'likes'
        }
      },

      //bo nhung thu du thua trong bang like, giu lai post_id va user_id
      {
        $addFields: {
          likes: {
            $map: {
              input: '$likes',
              as: 'like',
              in: {
                user_id: '$$like.user_id',
                post_id: '$$like.post_id'
              }
            }
          }
        }
      },
      // check neu user da like post thi tra ve true, con khong thi tra ve false
      {
        $addFields: {
          is_like: {
            $in: [new ObjectId(user_id), '$likes.user_id']
          }
        }
      },
      // lay comment cua post
      {
        $lookup: {
          from: 'comment_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'comments'
        }
      },

      //loại bỏ những comment bị ban trong mảng comment vừa nối
      {
        $addFields: {
          comments: {
            $filter: {
              input: '$comments',
              as: 'comment',
              cond: { $eq: ['$$comment.is_banned', false] }
            }
          }
        }
      },
      {
        $addFields: {
          comments: {
            $map: {
              input: '$comments',
              as: 'comment',
              in: {
                _id: '$$comment._id',
                content: '$$comment.content',
                user_id: '$$comment.user_id',
                post_id: '$$comment.post_id',
                parent_comment_id: '$$comment.parent_comment_id',
                createdAt: '$$comment.createdAt'
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'posts',
          localField: 'parent_id',
          foreignField: '_id',
          as: 'parent_post'
        }
      },
      {
        $unwind: { path: '$parent_post', preserveNullAndEmptyArrays: true }
      },
      //Nếu có parent_post id thì nếu parent_post bị ban thì không hiển thị còn không thì hiển thị
      //Nếu parent_post id bằng null nếu post bị ban thì không hiển thị còn không thì hiển thị
      {
        $match: {
          $or: [
            {
              'parent_post.is_banned': false
            },
            {
              parent_id: null,
              is_banned: false
            }
          ]
        }
      },
      //lay image array cua post cha
      {
        $lookup: {
          from: 'image_posts',
          localField: 'parent_post._id',
          foreignField: 'post_id',
          as: 'parent_images'
        }
      },
      {
        $addFields: {
          parent_images: {
            $map: {
              input: '$parent_images',
              as: 'image',
              in: '$$image.url'
            }
          }
        }
      },
      // noi parent_post voi user de lay thong tin user cua post cha
      {
        $lookup: {
          from: 'users',
          localField: 'parent_post.user_id',
          foreignField: '_id',
          as: 'parent_user'
        }
      },
      {
        $unwind: { path: '$parent_user', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'parent_id',
          as: 'share_posts'
        }
      },

      // loại bỏ những post bị ban trong mảng share_posts vừa nối
      {
        $addFields: {
          share_posts: {
            $filter: {
              input: '$share_posts',
              as: 'share_post',
              cond: { $eq: ['$$share_post.is_banned', false] }
            }
          }
        }
      },
      // dem so luong like
      {
        $addFields: {
          like_count: { $size: '$likes' }
        }
      },
      {
        $addFields: {
          comment_count: { $size: '$comments' }
        }
      },
      //dem so luong share
      {
        $addFields: {
          share_count: { $size: '$share_posts' }
        }
      },
      // bo het password cua user va parent_user
      {
        $project: {
          'user.password': 0,
          'parent_user.password': 0
        }
      }
    ])
    if (!post || post.length === 0) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.POST_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return post
  }
  async getNewFeedsService({ user_id, page, limit }: { user_id: string; page: number; limit: number }) {
    if (!limit) {
      limit = 5
    }
    if (!page) {
      page = 1
    }

    const user_id_obj = new ObjectId(user_id)
    // tìm những tài khoản mà user đã theo dõi
    const follow_ids = await FollowModel.find({
      user_id: user_id_obj
    }).select('follow_id')

    const follow_ids_arr = follow_ids.map((f) => f.follow_id)
    follow_ids_arr.push(user_id_obj)

    const newFeeds = await PostModel.aggregate([
      {
        // lấy post public và những post trong trạng thái chỉ cho người đã theo dõi xem
        $match: {
          $or: [
            {
              status: PostStatus.publish
            },
            {
              status: PostStatus.following,
              user_id: { $in: follow_ids_arr }
            }
          ],
          is_banned: false
        }
      },
      {
        $lookup: {
          from: 'image_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'images'
        }
      },
      {
        $addFields: {
          images: {
            $map: {
              input: '$images',
              as: 'image',
              in: '$$image.url'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'like_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'likes'
        }
      },

      //bo nhung thu du thua trong bang like, giu lai post_id va user_id
      {
        $addFields: {
          likes: {
            $map: {
              input: '$likes',
              as: 'like',
              in: {
                user_id: '$$like.user_id',
                post_id: '$$like.post_id'
              }
            }
          }
        }
      },
      // check neu user da like post thi tra ve true, con khong thi tra ve false
      {
        $addFields: {
          is_like: {
            $in: [new ObjectId(user_id), '$likes.user_id']
          }
        }
      },
      // lay comment cua post
      {
        $lookup: {
          from: 'comment_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'comments'
        }
      },
      // loại bỏ những comment bị ban trong mảng comment vừa nối
      {
        $addFields: {
          comments: {
            $filter: {
              input: '$comments',
              as: 'comment',
              cond: { $eq: ['$$comment.is_banned', false] }
            }
          }
        }
      },

      {
        $addFields: {
          comments: {
            $map: {
              input: '$comments',
              as: 'comment',
              in: {
                _id: '$$comment._id',
                content: '$$comment.content',
                user_id: '$$comment.user_id',
                post_id: '$$comment.post_id',
                parent_comment_id: '$$comment.parent_comment_id',
                createdAt: '$$comment.createdAt'
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'posts',
          localField: 'parent_id',
          foreignField: '_id',
          as: 'parent_post'
        }
      },
      //Nếu có parent_post id thì nếu parent_post bị ban thì không hiển thị còn không thì hiển thị
      //Nếu parent_post id bằng null nếu post bị ban thì không hiển thị còn không thì hiển thị
      {
        $match: {
          $or: [
            {
              'parent_post.is_banned': false
            },
            {
              parent_id: null,
              is_banned: false
            }
          ]
        }
      },
      {
        $unwind: { path: '$parent_post', preserveNullAndEmptyArrays: true }
      },
      //lay image array cua post cha
      {
        $lookup: {
          from: 'image_posts',
          localField: 'parent_post._id',
          foreignField: 'post_id',
          as: 'parent_images'
        }
      },
      {
        $addFields: {
          parent_images: {
            $map: {
              input: '$parent_images',
              as: 'image',
              in: '$$image.url'
            }
          }
        }
      },
      // noi parent_post voi user de lay thong tin user cua post cha
      {
        $lookup: {
          from: 'users',
          localField: 'parent_post.user_id',
          foreignField: '_id',
          as: 'parent_user'
        }
      },
      {
        $unwind: { path: '$parent_user', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'parent_id',
          as: 'share_posts'
        }
      },
      // loại bỏ những post bị ban trong mảng share_posts vừa nối
      {
        $addFields: {
          share_posts: {
            $filter: {
              input: '$share_posts',
              as: 'share_post',
              cond: { $eq: ['$$share_post.is_banned', false] }
            }
          }
        }
      },
      // dem so luong like
      {
        $addFields: {
          like_count: { $size: '$likes' }
        }
      },
      {
        $addFields: {
          comment_count: { $size: '$comments' }
        }
      },
      //dem so luong share
      {
        $addFields: {
          share_count: { $size: '$share_posts' }
        }
      },
      // bo het password cua user va parent_user
      {
        $project: {
          'user.password': 0,
          'parent_user.password': 0
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      }
    ])
    if (!newFeeds) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.POST_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return { newFeeds, page, limit }
  }
  async likePostService({ user_id, post_id }: { user_id: string; post_id: string }) {
    const newLike = await LikePostModel.findOneAndUpdate(
      {
        user_id: user_id,
        post_id: post_id
      },
      {
        user_id: user_id,
        post_id: post_id
      },
      {
        upsert: true,
        new: true
      }
    )

    const user_post_id = await PostModel.findOne({ _id: post_id })

    if (!user_post_id) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.POST_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    console.log(user_post_id)
    if (user_post_id.user_id.toString() !== user_id) {
      await NotificationModel.findOneAndUpdate(
        {
          sender_id: new ObjectId(user_id),
          receiver_id: user_post_id.user_id,
          link_id: post_id,
          type: NotificationTypes.likePost
        },
        {
          sender_id: new ObjectId(user_id),
          receiver_id: user_post_id.user_id,
          content: 'Đã thích bài viết của bạn',
          name_notification: user_post_id.content || 'Bài viết không có nội dung',
          link_id: post_id,
          type: NotificationTypes.likePost
        },
        {
          upsert: true
        }
      )
    }
    return newLike
  }
  async unLikePostService({ user_id, post_id }: { user_id: string; post_id: string }) {
    const newLike = await LikePostModel.findOneAndDelete({
      user_id: user_id,
      post_id: post_id
    })
    return newLike
  }
  async sharePostService({
    user_id,
    parent_id,
    privacy,
    content
  }: {
    user_id: string
    parent_id: string
    privacy: string
    content: string
  }) {
    const newPost = await PostModel.create({
      content: content,
      status: Number(privacy),
      user_id: user_id,
      parent_id: parent_id,
      type: PostTypes.sharePost
    })
    if (!newPost) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.NOT_CREATE_POST,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const user_post_id = await PostModel.findOne({ _id: parent_id })

    if (!user_post_id) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.POST_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (user_post_id.user_id.toString() !== user_id) {
      await NotificationModel.create({
        sender_id: new ObjectId(user_id),
        receiver_id: user_post_id.user_id,
        content: 'Đã chia sẻ bài viết của bạn',
        name_notification: user_post_id.content || 'Bài viết không có nội dung',
        link_id: newPost._id,
        type: NotificationTypes.sharePost
      })
    }

    return newPost
  }
  async getCommentsPostService({ post_id, limit, page }: { post_id: string; limit: number; page: number }) {
    if (!limit) {
      limit = 3
    }
    if (!page) {
      page = 1
    }
    const comments = await CommentPostModel.aggregate([
      // chỉ lấy parent comment
      {
        $match: {
          post_id: new ObjectId(post_id),
          parent_comment_id: null,
          is_banned: false
        }
      },
      {
        $lookup: {
          from: 'comment_posts',
          localField: '_id',
          foreignField: 'parent_comment_id',
          as: 'child_comments'
        }
      },
      //loại bỏ những child_comment bị ban trong mảng comment vừa nối
      {
        $addFields: {
          child_comments: {
            $filter: {
              input: '$child_comments',
              as: 'child_comment',
              cond: { $eq: ['$$child_comment.is_banned', false] }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $addFields: {
          child_comments_count: { $size: '$child_comments' }
        }
      },
      {
        $project: {
          'user.password': 0
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      }
    ])
    return {
      comments,
      page,
      limit
    }
  }
  async getChildCommentsPostService({
    parent_comment_id,
    limit,
    page
  }: {
    parent_comment_id: string
    limit: number
    page: number
  }) {
    if (!limit) {
      limit = 3
    }
    if (!page) {
      page = 1
    }
    const child_comments = await CommentPostModel.aggregate([
      {
        $match: {
          parent_comment_id: new ObjectId(parent_comment_id),
          is_banned: false
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      }
    ])
    return {
      child_comments,
      page,
      limit
    }
  }
  async createCommentPostService({
    content,
    user_id,
    post_id,
    parent_comment_id
  }: {
    content: string
    user_id: string
    post_id: string
    parent_comment_id?: string
  }) {
    if (!parent_comment_id) {
      const newComment = await CommentPostModel.create({
        content: content,
        user_id: user_id,
        post_id: post_id
      })

      const user_post_id = await PostModel.findOne({ _id: post_id })

      if (!user_post_id) {
        throw new ErrorWithStatus({
          message: POST_MESSAGE.POST_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      if (user_post_id.user_id.toString() !== user_id) {
        await NotificationModel.create({
          sender_id: new ObjectId(user_id),
          receiver_id: user_post_id.user_id,
          content: 'Đã bình luận bài viết của bạn',
          name_notification: user_post_id.content || 'Bài viết không có nội dung',
          link_id: post_id,
          type: NotificationTypes.commentPost
        })
      }
      return newComment
    }
    const newComment = await CommentPostModel.create({
      content: content,
      user_id: user_id,
      post_id: post_id,
      parent_comment_id: parent_comment_id
    })

    const user_parent_comment_id = await CommentPostModel.findOne({ _id: parent_comment_id })

    if (!user_parent_comment_id) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.COMMENT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (user_parent_comment_id.user_id.toString() !== user_id) {
      await NotificationModel.create({
        sender_id: new ObjectId(user_id),
        receiver_id: user_parent_comment_id.user_id,
        content: 'Đã trả lời bình luận của bạn',
        name_notification: user_parent_comment_id.content || 'Bình luận không có nội dung',
        link_id: post_id,
        type: NotificationTypes.commentChildPost
      })
    }

    return newComment
  }
  async deletePostforEachUserService({ post_id, user_id }: { post_id: string; user_id: string }) {
    await Promise.all([
      PostModel.findOneAndDelete({
        _id: post_id,
        user_id: user_id
      }),
      ImagePostModel.deleteMany({
        post_id: post_id
      }),
      LikePostModel.deleteMany({
        post_id: post_id
      }),
      CommentPostModel.deleteMany({
        post_id: post_id
      })
    ])
    const share_post = await PostModel.find({
      parent_id: post_id
    })
    await Promise.all(
      share_post.map(async (sp) => {
        await Promise.all([
          PostModel.findOneAndDelete({
            _id: sp._id
          }),
          ImagePostModel.deleteMany({
            post_id: sp._id
          }),
          LikePostModel.deleteMany({
            post_id: sp._id
          }),
          CommentPostModel.deleteMany({
            post_id: sp._id
          })
        ])
      })
    )
    return true
  }
  async getMePostsService({ user_id, page, limit }: { user_id: string; page: number; limit: number }) {
    if (!limit) {
      limit = 5
    }
    if (!page) {
      page = 1
    }
    const posts = await PostModel.aggregate([
      {
        $match: {
          user_id: new ObjectId(user_id),
          is_banned: false
        }
      },
      {
        $lookup: {
          from: 'image_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'images'
        }
      },
      {
        $addFields: {
          images: {
            $map: {
              input: '$images',
              as: 'image',
              in: '$$image.url'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'like_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'likes'
        }
      },

      //bo nhung thu du thua trong bang like, giu lai post_id va user_id
      {
        $addFields: {
          likes: {
            $map: {
              input: '$likes',
              as: 'like',
              in: {
                user_id: '$$like.user_id',
                post_id: '$$like.post_id'
              }
            }
          }
        }
      },
      // check neu user da like post thi tra ve true, con khong thi tra ve false
      {
        $addFields: {
          is_like: {
            $in: [new ObjectId(user_id), '$likes.user_id']
          }
        }
      },
      // lay commet cua post
      {
        $lookup: {
          from: 'comment_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'comments'
        }
      },
      // loại bỏ những comment bị ban trong mảng comment vừa nối
      {
        $addFields: {
          comments: {
            $filter: {
              input: '$comments',
              as: 'comment',
              cond: { $eq: ['$$comment.is_banned', false] }
            }
          }
        }
      },

      {
        $addFields: {
          comments: {
            $map: {
              input: '$comments',
              as: 'comment',
              in: {
                _id: '$$comment._id',
                content: '$$comment.content',
                user_id: '$$comment.user_id',
                post_id: '$$comment.post_id',
                parent_comment_id: '$$comment.parent_comment_id',
                createdAt: '$$comment.createdAt'
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'posts',
          localField: 'parent_id',
          foreignField: '_id',
          as: 'parent_post'
        }
      },
      //Nếu có parent_post id thì nếu parent_post bị ban thì không hiển thị còn không thì hiển thị
      //Nếu parent_post id bằng null nếu post bị ban thì không hiển thị còn không thì hiển thị
      {
        $match: {
          $or: [
            {
              'parent_post.is_banned': false
            },
            {
              parent_id: null,
              is_banned: false
            }
          ]
        }
      },
      {
        $unwind: { path: '$parent_post', preserveNullAndEmptyArrays: true }
      },
      //lay image array cua post cha
      {
        $lookup: {
          from: 'image_posts',
          localField: 'parent_post._id',
          foreignField: 'post_id',
          as: 'parent_images'
        }
      },
      {
        $addFields: {
          parent_images: {
            $map: {
              input: '$parent_images',
              as: 'image',
              in: '$$image.url'
            }
          }
        }
      },
      // noi parent_post voi user de lay thong tin user cua post cha
      {
        $lookup: {
          from: 'users',
          localField: 'parent_post.user_id',
          foreignField: '_id',
          as: 'parent_user'
        }
      },
      {
        $unwind: { path: '$parent_user', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'parent_id',
          as: 'share_posts'
        }
      },
      // loại bỏ những post bị ban trong mảng share_posts vừa nối
      {
        $addFields: {
          share_posts: {
            $filter: {
              input: '$share_posts',
              as: 'share_post',
              cond: { $eq: ['$$share_post.is_banned', false] }
            }
          }
        }
      },
      // dem so luong like
      {
        $addFields: {
          like_count: { $size: '$likes' }
        }
      },
      {
        $addFields: {
          comment_count: { $size: '$comments' }
        }
      },
      //dem so luong share
      {
        $addFields: {
          share_count: { $size: '$share_posts' }
        }
      },
      // bo het password cua user va parent_user
      {
        $project: {
          'user.password': 0,
          'parent_user.password': 0
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      }
    ])
    if (!posts) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.POST_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return { posts, page, limit }
  }
  async getUserPostsService({
    id,
    user_id: follow_user,
    page,
    limit
  }: {
    id: string
    user_id: string
    page: number
    limit: number
  }) {
    if (!limit) {
      limit = 5
    }
    if (!page) {
      page = 1
    }

    // lấy những user đã theo dõi user này

    const follow_ids = await FollowModel.find({
      follow_id: new ObjectId(id)
    }).select('user_id')

    const follow_ids_arr = follow_ids.map((f) => f.user_id)

    const posts = await PostModel.aggregate([
      {
        // thêm 1 trường is_follow để check xem user đã follow user này chưa
        $addFields: {
          is_follow: {
            $in: [new ObjectId(follow_user), follow_ids_arr]
          }
        }
      },
      {
        // lấy post public và những post trong trạng thái chỉ cho người đã theo dõi xem
        $match: {
          user_id: new ObjectId(id),
          is_banned: false,
          $or: [
            {
              status: PostStatus.publish
            },
            // nếu is_follow = true thì cho xem những post là following
            {
              status: PostStatus.following,
              is_follow: true
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'image_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'images'
        }
      },
      {
        $addFields: {
          images: {
            $map: {
              input: '$images',
              as: 'image',
              in: '$$image.url'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'like_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'likes'
        }
      },

      //bo nhung thu du thua trong bang like, giu lai post_id va user_id
      {
        $addFields: {
          likes: {
            $map: {
              input: '$likes',
              as: 'like',
              in: {
                user_id: '$$like.user_id',
                post_id: '$$like.post_id'
              }
            }
          }
        }
      },
      // check neu user da like post thi tra ve true, con khong thi tra ve false
      {
        $addFields: {
          is_like: {
            $in: [new ObjectId(follow_user), '$likes.user_id']
          }
        }
      },
      // lay commet cua post
      {
        $lookup: {
          from: 'comment_posts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'comments'
        }
      },
      // loại bỏ những comment bị ban trong mảng comment vừa nối
      {
        $addFields: {
          comments: {
            $filter: {
              input: '$comments',
              as: 'comment',
              cond: { $eq: ['$$comment.is_banned', false] }
            }
          }
        }
      },

      {
        $addFields: {
          comments: {
            $map: {
              input: '$comments',
              as: 'comment',
              in: {
                _id: '$$comment._id',
                content: '$$comment.content',
                user_id: '$$comment.user_id',
                post_id: '$$comment.post_id',
                parent_comment_id: '$$comment.parent_comment_id',
                createdAt: '$$comment.createdAt'
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'posts',
          localField: 'parent_id',
          foreignField: '_id',
          as: 'parent_post'
        }
      },
      //Nếu có parent_post id thì nếu parent_post bị ban thì không hiển thị còn không thì hiển thị
      //Nếu parent_post id bằng null nếu post bị ban thì không hiển thị còn không thì hiển thị
      {
        $match: {
          $or: [
            {
              'parent_post.is_banned': false
            },
            {
              parent_id: null,
              is_banned: false
            }
          ]
        }
      },
      {
        $unwind: { path: '$parent_post', preserveNullAndEmptyArrays: true }
      },
      //lay image array cua post cha
      {
        $lookup: {
          from: 'image_posts',
          localField: 'parent_post._id',
          foreignField: 'post_id',
          as: 'parent_images'
        }
      },
      {
        $addFields: {
          parent_images: {
            $map: {
              input: '$parent_images',
              as: 'image',
              in: '$$image.url'
            }
          }
        }
      },
      // noi parent_post voi user de lay thong tin user cua post cha
      {
        $lookup: {
          from: 'users',
          localField: 'parent_post.user_id',
          foreignField: '_id',
          as: 'parent_user'
        }
      },
      {
        $unwind: { path: '$parent_user', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'parent_id',
          as: 'share_posts'
        }
      },
      // loại bỏ những post bị ban trong mảng share_posts vừa nối
      {
        $addFields: {
          share_posts: {
            $filter: {
              input: '$share_posts',
              as: 'share_post',
              cond: { $eq: ['$$share_post.is_banned', false] }
            }
          }
        }
      },
      // dem so luong like
      {
        $addFields: {
          like_count: { $size: '$likes' }
        }
      },
      {
        $addFields: {
          comment_count: { $size: '$comments' }
        }
      },
      //dem so luong share
      {
        $addFields: {
          share_count: { $size: '$share_posts' }
        }
      },
      // bo het password cua user va parent_user
      {
        $project: {
          'user.password': 0,
          'parent_user.password': 0
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      }
    ])

    if (!posts) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.POST_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return { posts, page, limit }
  }
  async deletecommentPostService({ comment_id, user_id }: { comment_id: string; user_id: string }) {
    const comment = await CommentPostModel.findOne({
      _id: comment_id,
      parent_comment_id: null
    })
    if (comment) {
      const commentId = comment._id
      await Promise.all([
        CommentPostModel.deleteMany({
          parent_comment_id: commentId
        }),
        CommentPostModel.deleteOne({
          _id: commentId
        })
      ])
    }

    return true
  }
  async deleteChildCommentPostService({ comment_id, user_id }: { comment_id: string; user_id: string }) {
    const comment = await CommentPostModel.findOne({
      _id: comment_id
    })
    if (comment) {
      await CommentPostModel.deleteOne({
        _id: comment_id
      })
    }
    return true
  }
  async createReportPostService({ post_id, user_id, reason }: { post_id: string; user_id: string; reason: string }) {
    // tìm xem trong mảng report_post đã có bài post này chưa
    const report = await PostModel.findOne({
      _id: post_id,
      'report_post.user_id': user_id
    })
    if (report) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.REPORTED_POST,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    const newReport = await PostModel.findOneAndUpdate(
      {
        _id: post_id
      },
      {
        $push: {
          report_post: {
            user_id: user_id,
            reason: reason
          }
        }
      },
      {
        new: true
      }
    )

    return newReport
  }

  // Function để chia sẻ meal plan lên trang post
  async shareMealPlanToPostService({
    user_id,
    meal_plan_id,
    privacy,
    content
  }: {
    user_id: string
    meal_plan_id: string
    privacy: string
    content: string
  }) {
    // Kiểm tra meal plan có tồn tại không
    const mealPlan = await MealPlanModel.findById(meal_plan_id)
    if (!mealPlan) {
      throw new ErrorWithStatus({
        message: 'Meal plan not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Tạo post mới với meal_plan_id
    const newPost = await PostModel.create({
      content: content,
      status: Number(privacy),
      user_id: new ObjectId(user_id),
      meal_plan_id: new ObjectId(meal_plan_id),
      type: PostTypes.shareMealPlan
    })

    if (!newPost) {
      throw new ErrorWithStatus({
        message: POST_MESSAGE.NOT_CREATE_POST,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Tăng applied_count cho meal plan
    await MealPlanModel.findByIdAndUpdate(
      meal_plan_id,
      { $inc: { applied_count: 1 } }
    )

    // Tạo notification nếu không phải tác giả meal plan
    if (mealPlan.author_id.toString() !== user_id) {
      await NotificationModel.create({
        sender_id: new ObjectId(user_id),
        receiver_id: mealPlan.author_id,
        content: 'đã chia sẻ thực đơn của bạn',
        name_notification: mealPlan.title || 'Thực đơn không có tiêu đề',
        link_id: newPost._id,
        type: NotificationTypes.shareMealPlan
      })
    }

    return newPost
  }

  // Function để lấy posts có meal plan
  async getPostsWithMealPlanService({ page = '1', limit = '10', user_id }: { page?: string; limit?: string; user_id?: string }) {
    const skip = (Number(page) - 1) * Number(limit)
    
    const aggregationPipeline = [
      {
        $match: {
          meal_plan_id: { $exists: true, $ne: null },
          is_banned: false
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'mealplans',
          localField: 'meal_plan_id',
          foreignField: '_id',
          as: 'meal_plan'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $unwind: '$meal_plan'
      },
      {
        $lookup: {
          from: 'likeposts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'like_posts'
        }
      },
      {
        $lookup: {
          from: 'commentposts',
          localField: '_id',
          foreignField: 'post_id',
          as: 'comment_posts'
        }
      },
      {
        $addFields: {
          like_count: { $size: '$like_posts' },
          comment_count: { $size: '$comment_posts' },
          is_liked: user_id ? {
            $in: [new ObjectId(user_id), '$like_posts.user_id']
          } : false
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          user_id: 1,
          meal_plan_id: 1,
          status: 1,
          type: 1,
          created_at: 1,
          updated_at: 1,
          like_count: 1,
          comment_count: 1,
          is_liked: 1,
          user: {
            _id: 1,
            username: 1,
            avatar: 1,
            name: 1
          },
          meal_plan: {
            _id: 1,
            title: 1,
            description: 1,
            image: 1,
            images: 1,
            duration: 1,
            category: 1,
            target_calories: 1,
            difficulty_level: 1,
            rating: 1,
            applied_count: 1
          }
        }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: Number(limit)
      }
    ]

    const posts = await PostModel.aggregate(aggregationPipeline as any)
    const total = await PostModel.countDocuments({
      meal_plan_id: { $exists: true, $ne: null },
      is_banned: false
    })

    return {
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  }

  // ...existing code...
}

const postService = new PostService()
export default postService
