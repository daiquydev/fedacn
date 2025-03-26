import { Card, Avatar, Button, Space, Tabs, Image, Divider } from 'antd';
import { HeartOutlined, HeartFilled, CommentOutlined, BookmarkOutlined, BookmarkFilled, ShareAltOutlined } from '@ant-design/icons';
import { MenuPost } from '../../types/menu';
import { useState } from 'react';

interface MenuPostDetailProps {
  post: MenuPost;
}

const MenuPostDetail = ({ post }: MenuPostDetailProps) => {
  const [activeTab, setActiveTab] = useState('1');

  const renderMealItems = (items: any[]) => (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-2">{item.name}</h4>
          
          {item.images && item.images.length > 0 && (
            <div className="mb-4">
              <Image.PreviewGroup>
                <div className="flex gap-2 overflow-x-auto">
                  {item.images.map((img: string, i: number) => (
                    <Image
                      key={i}
                      src={img}
                      alt={item.name}
                      width={200}
                      className="rounded-lg object-cover"
                    />
                  ))}
                </div>
              </Image.PreviewGroup>
            </div>
          )}

          {item.ingredients && (
            <div className="mb-3">
              <h5 className="font-medium mb-2">Nguyên liệu:</h5>
              <ul className="list-disc list-inside text-gray-600">
                {item.ingredients.map((ingredient: string, i: number) => (
                  <li key={i}>{ingredient}</li>
                ))}
              </ul>
            </div>
          )}

          {item.recipe && (
            <div className="mb-3">
              <h5 className="font-medium mb-2">Công thức:</h5>
              <p className="text-gray-600 whitespace-pre-line">{item.recipe}</p>
            </div>
          )}

          {item.notes && (
            <div className="mt-2">
              <h5 className="font-medium mb-1">Ghi chú:</h5>
              <p className="text-gray-500 italic">{item.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderDayMenu = (day: any) => (
    <div className="space-y-6">
      {day.meals.map((meal: any, index: number) => (
        <div key={index}>
          <h3 className="text-xl font-semibold mb-4">
            {meal.type === 'breakfast' && 'Bữa sáng'}
            {meal.type === 'lunch' && 'Bữa trưa'}
            {meal.type === 'dinner' && 'Bữa tối'}
            {meal.type === 'snack' && 'Bữa phụ'}
          </h3>
          {renderMealItems(meal.items)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Avatar size={48} src={post.author.avatar} />
            <div className="ml-3">
              <div className="font-semibold text-lg">{post.author.name}</div>
              <div className="text-gray-500">{post.createdAt}</div>
            </div>
          </div>
          <Button type="primary">Theo dõi</Button>
        </div>

        {/* Title and Description */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
          {post.description && (
            <p className="text-gray-600">{post.description}</p>
          )}
        </div>

        {/* Interaction Buttons */}
        <div className="flex items-center gap-4 mb-6">
          <Button icon={post.likes > 0 ? <HeartFilled /> : <HeartOutlined />}>
            {post.likes} Thích
          </Button>
          <Button icon={<CommentOutlined />}>
            {post.comments} Bình luận
          </Button>
          <Button icon={post.saved ? <BookmarkFilled /> : <BookmarkOutlined />}>
            Lưu
          </Button>
          <Button icon={<ShareAltOutlined />}>
            Chia sẻ
          </Button>
        </div>

        <Divider />

        {/* Menu Content */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={post.days.map((day, index) => ({
            key: String(index + 1),
            label: `Ngày ${index + 1}`,
            children: renderDayMenu(day)
          }))}
        />

        <Divider />

        {/* Shopping List Button */}
        <div className="mt-4">
          <Button type="primary" block size="large">
            Tạo danh sách mua sắm
          </Button>
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Bình luận</h3>
          {/* Add CommentSection component here */}
        </div>
      </Card>
    </div>
  );
};

export default MenuPostDetail; 