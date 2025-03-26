import { Avatar, Input, Button, List } from 'antd';
import { useState } from 'react';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
}

const CommentSection = ({ comments, onAddComment }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input.TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Thêm bình luận..."
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
        <Button type="primary" onClick={handleSubmit}>
          Đăng
        </Button>
      </div>

      <List
        itemLayout="horizontal"
        dataSource={comments}
        renderItem={(comment) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar src={comment.author.avatar} />}
              title={comment.author.name}
              description={
                <div>
                  <p>{comment.content}</p>
                  <span className="text-gray-500 text-sm">{comment.createdAt}</span>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default CommentSection; 