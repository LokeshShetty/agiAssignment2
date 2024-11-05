import { useState, useEffect, useRef } from "react";
import { Table, Modal, Avatar, List, Typography, Spin } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { UserOutlined, MessageOutlined } from "@ant-design/icons";

const { Text } = Typography;

const generateRandomChatData = () => {
  const names = ["Alice", "Bob", "Charlie", "Daisy", "Edward"];
  const messages = [
    "Hello!",
    "How are you?",
    "What's up?",
    "Goodbye!",
    "See you later!",
  ];
  return Array.from({ length: 100 }, (_, id) => ({
    id,
    username: names[Math.floor(Math.random() * names.length)],
    latestMessage: messages[Math.floor(Math.random() * messages.length)],
  }));
};

const generateRandomChatMessages = (length = 20) => {
  const sampleMessages = [
    { text: "Hello there!", isRead: false },
    { text: "This is a sample message.", isRead: false },
    { text: "How are you doing today?", isRead: false },
  ];
  return Array.from({ length }, () => {
    const msg =
      sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
    return { ...msg, id: Math.random().toString(36).substr(2, 9) };
  });
};

const ChatTable = () => {
  const [chatData, setChatData] = useState(generateRandomChatData());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const scrollableDivRef = useRef(null);
  const messageRefs = useRef([]);
  const observerRef = useRef(null);

  const openChat = () => {
    setChatMessages([]);
    setHasMoreMessages(true);
    messageRefs.current = [];
    const newMessages = generateRandomChatMessages();
    setChatMessages(newMessages);
    setIsModalVisible(true);
  };

  const loadMoreMessages = () => {
    if (!hasMoreMessages) return;
    setTimeout(() => {
      const newMessages = generateRandomChatMessages();
      setChatMessages((prevMessages) => [...prevMessages, ...newMessages]);
      if (newMessages.length < 20) setHasMoreMessages(false);
    }, 1000);
  };

  const markMessagesAsRead = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const messageId = entry.target.id;
        setChatMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, isRead: true } : msg
          )
        );
      }
    });
  };

  const initializeObserver = () => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(markMessagesAsRead, {
      threshold: 1.0,
    });
    messageRefs.current.forEach((message) => {
      if (message) observerRef.current.observe(message);
    });
  };

  useEffect(() => {
    const checkVisibleMessages = () => {
      const visibleMessages = messageRefs.current.filter((message) => {
        if (message) {
          const rect = message.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= window.innerHeight;
        }
        return false;
      });

      if (visibleMessages.length) {
        const entries = visibleMessages.map((message) => ({
          target: message,
          isIntersecting: true,
        }));
        markMessagesAsRead(entries);
      }
    };

    if (isModalVisible) {
      initializeObserver();
      setTimeout(checkVisibleMessages, 0);
    } else if (observerRef.current) {
      observerRef.current.disconnect();
    }

    return () => observerRef.current && observerRef.current.disconnect();
  }, [isModalVisible, chatMessages]);

  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Latest Message",
      dataIndex: "latestMessage",
      key: "latestMessage",
    },
    {
      title: "",
      key: "action",
      render: () => (
        <MessageOutlined
          style={{ fontSize: "20px", cursor: "pointer" }}
          onClick={openChat}
        />
      ),
    },
  ];

  const [isLoading, setIsLoading] = useState(false);
  const loadMoreData = () => {
    if (isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      const newRows = generateRandomChatData();
      setChatData((prevData) => [...prevData, ...newRows]);
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    if (isModalVisible) {
      setTimeout(() => {
        if (scrollableDivRef.current) {
          scrollableDivRef.current.scrollTop = 0;
        }
      }, 0);
    }
  }, [isModalVisible]);

  return (
    <>
      <InfiniteScroll
        dataLength={chatData.length}
        next={loadMoreData}
        hasMore={!isLoading}
        loader={<Spin style={{ margin: "20px", display: "block" }} />}
      >
        <Table
          bordered
          scroll={{ y: 500 }}
          columns={columns}
          dataSource={chatData}
          rowKey="id"
          pagination={false}
        />

        <Modal
          title="Chat History"
          open={isModalVisible}
          footer={null}
          onCancel={() => setIsModalVisible(false)}
          width={"90%"}
        >
          <div
            id="scrollableDiv"
            ref={scrollableDivRef}
            style={{
              height: 400,
              overflow: "auto",
              padding: "0 16px",
              backgroundColor: "#f0f0f0",
            }}
          >
            <InfiniteScroll
              dataLength={chatMessages.length}
              next={loadMoreMessages}
              hasMore={hasMoreMessages}
              loader={<Spin style={{ margin: "20px", display: "block" }} />}
              scrollableTarget="scrollableDiv"
              endMessage={
                <Text style={{ textAlign: "center" }}>No more messages</Text>
              }
            >
              <List
                dataSource={chatMessages}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    ref={(el) => messageRefs.current.push(el)}
                    id={item.id}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <span>
                          {item.text}
                          <Text type="secondary" style={{ float: "right" }}>
                            {item.isRead ? (
                              <span style={{ color: "blue" }}>✓✓</span>
                            ) : (
                              <span style={{ color: "grey" }}>✓✓</span>
                            )}
                          </Text>
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            </InfiniteScroll>
          </div>
        </Modal>
      </InfiniteScroll>
    </>
  );
};

export default ChatTable;
