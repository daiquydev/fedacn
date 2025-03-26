import { Card, Avatar, Button, Space } from 'antd';
import { HeartOutlined, HeartFilled, CommentOutlined, BookmarkOutlined, BookmarkFilled } from '@ant-design/icons';
import { MenuPost } from '../../types/menu';
import { useNavigate } from 'react-router-dom';

interface MenuPostListProps {
  posts: MenuPost[];
}

const MenuPostList = ({ posts }: MenuPostListProps) => {
  const navigate = useNavigate();

  const handlePostClick = (postId: string) => {
    navigate(`/menu/${postId}`);
  };

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <Card 
          key={post.id} 
          className="w-full cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handlePostClick(post.id)}
        >
          {/* ... existing content ... */}
        </Card>
      ))}
    </div>
  );
};

export default MenuPostList; 