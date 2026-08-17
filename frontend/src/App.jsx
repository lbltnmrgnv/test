import { useEffect, useMemo, useState } from 'react';

const ACCESS_TOKEN_KEY = 'book_store_access_token';
const REFRESH_TOKEN_KEY = 'book_store_refresh_token';
const DEMO_ACCOUNT = {
  email: 'demo@bookish.test',
  password: 'bookish123',
};

const catalogCategories = [
  { value: 'all', label: 'Все книги' },
  { value: 'fiction', label: 'Художественная литература' },
  { value: 'science', label: 'Научпоп' },
  { value: 'detective', label: 'Детективы' },
  { value: 'fantasy', label: 'Фантастика' },
  { value: 'romance', label: 'Романтика' },
  { value: 'business', label: 'Бизнес и саморазвитие' },
  { value: 'history', label: 'История' },
  { value: 'biography', label: 'Биографии' },
  { value: 'programming', label: 'Программирование' },
];

const catalogSectionTitles = {
  catalog: 'Все книги',
  genres: 'Жанры',
  authors: 'Авторы',
  new: 'Новинки',
  sale: 'Акции',
};

const emptyForms = {
  register: { name: '', email: '', password: '' },
  login: DEMO_ACCOUNT,
  topUp: { amountCents: '5000', description: 'Wallet top up' },
  createBook: {
    id: '',
    title: '',
    author: '',
    categorySlug: 'books',
    priceCents: '1990',
    stock: '5',
  },
};

function App() {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(ACCESS_TOKEN_KEY) || '',
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem(REFRESH_TOKEN_KEY) || '',
  );
  const [activePage, setActivePage] = useState('home');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [catalogSection, setCatalogSection] = useState('catalog');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [forms, setForms] = useState(emptyForms);
  const [inventoryDrafts, setInventoryDrafts] = useState({});
  const [message, setMessage] = useState({ text: '', tone: '' });
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [busyAction, setBusyAction] = useState('');

  useEffect(() => {
    void refreshBooks();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      setWalletBalance(0);
      setOrders([]);
      setWalletTransactions([]);
      return;
    }

    void refreshSessionData();
  }, [accessToken]);

  const selectedBook = useMemo(
    () => books.find(book => book.id === selectedBookId) ?? books[0] ?? null,
    [books, selectedBookId],
  );

  const filteredBooks = useMemo(() => {
    const prepared = books.filter(book => {
      const haystack = `${book.title} ${book.author}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'in-stock' && book.stock > 0) ||
        (stockFilter === 'out-of-stock' && book.stock === 0);

      const matchesCategory =
        categoryFilter === 'all' || book.categorySlug === categoryFilter;
      const matchesAuthor =
        catalogSection !== 'authors' ||
        authorFilter === 'all' ||
        book.author === authorFilter;
      const matchesSection =
        (catalogSection !== 'new' || book.isNew) &&
        (catalogSection !== 'sale' || book.isOnSale);

      return (
        matchesSearch &&
        matchesStock &&
        matchesCategory &&
        matchesAuthor &&
        matchesSection
      );
    });

    if (sortBy === 'price-asc') {
      return [...prepared].sort((a, b) => a.priceCents - b.priceCents);
    }

    if (sortBy === 'price-desc') {
      return [...prepared].sort((a, b) => b.priceCents - a.priceCents);
    }

    if (sortBy === 'title') {
      return [...prepared].sort((a, b) => a.title.localeCompare(b.title));
    }

    return prepared;
  }, [authorFilter, books, catalogSection, categoryFilter, search, sortBy, stockFilter]);

  const catalogAuthors = useMemo(
    () => [...new Set(books.map(book => book.author))].sort(),
    [books],
  );

  const recentBooks = filteredBooks.slice(0, 6);
  const recommendedBooks = filteredBooks
    .filter(book => book.id !== selectedBook?.id)
    .slice(0, 4);
  const paidOrders = orders.filter(order => order.status === 'PAID');
  const spentTotal = paidOrders.reduce((sum, order) => sum + order.amountCents, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const book = books.find(candidate => candidate.id === item.bookId);
    return sum + (book ? book.priceCents * item.quantity : 0);
  }, 0);

  async function request(path, options = {}, withAuth = false, retry = true) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (withAuth && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`/api${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body,
    });

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      if (response.status === 401 && withAuth && retry && refreshToken) {
        const refreshed = await refreshSessionTokens();

        if (refreshed) {
          return request(path, options, withAuth, false);
        }
      }

      const error = new Error(payload?.message || 'Request failed');
      error.statusCode = response.status;
      throw error;
    }

    return payload;
  }

  async function refreshSessionTokens() {
    if (!refreshToken) {
      clearSession();
      return false;
    }

    try {
      const auth = await request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      persistSession(auth);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }

  async function refreshBooks() {
    const catalog = await request('/books');
    setBooks(catalog);
    setSelectedBookId(current => current || catalog[0]?.id || '');
    setInventoryDrafts(current => {
      const next = { ...current };

      for (const book of catalog) {
        next[book.id] = next[book.id] || {
          priceCents: String(book.priceCents),
          stock: String(book.stock),
        };
      }

      return next;
    });
  }

  async function refreshSessionData() {
    try {
      const [me, wallet, orderList, transactions] = await Promise.all([
        request('/auth/me', {}, true),
        request('/wallet', {}, true),
        request('/orders', {}, true),
        request('/wallet/transactions', {}, true),
      ]);

      setUser(me);
      setWalletBalance(wallet.balanceCents);
      setOrders(orderList);
      setWalletTransactions(transactions);
    } catch (error) {
      handleError(error);
    }
  }

  function persistSession(auth) {
    setAccessToken(auth.accessToken);
    setRefreshToken(auth.refreshToken);
    setUser(auth.user);
    setWalletBalance(auth.user.walletBalanceCents);
    localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
  }

  function clearSession() {
    setAccessToken('');
    setRefreshToken('');
    setUser(null);
    setWalletBalance(0);
    setOrders([]);
    setWalletTransactions([]);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  function setFormValue(form, field, value) {
    setForms(current => ({
      ...current,
      [form]: {
        ...current[form],
        [field]: value,
      },
    }));
  }

  function setInventoryValue(bookId, field, value) {
    setInventoryDrafts(current => ({
      ...current,
      [bookId]: {
        ...current[bookId],
        [field]: value,
      },
    }));
  }

  function showMessage(text, tone) {
    setMessage({ text, tone });
  }

  function handleError(error) {
    console.error(error);
    showMessage(error.message || 'Unexpected error.', 'error');
  }

  function goToPage(page) {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToCatalog(section) {
    setCatalogSection(section);
    if (section !== 'genres') {
      setCategoryFilter('all');
    }
    if (section !== 'authors') {
      setAuthorFilter('all');
    }
    goToPage('catalog');
  }

  async function handleRegister(event) {
    event.preventDefault();
    setBusyAction('register');

    try {
      const auth = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(forms.register),
      });

      persistSession(auth);
      setForms(current => ({ ...current, register: emptyForms.register }));
      showMessage('Account created and signed in.', 'success');
      goToPage('account');
      await refreshSessionData();
    } catch (error) {
      handleError(error);
    } finally {
      setBusyAction('');
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setBusyAction('login');

    try {
      const auth = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(forms.login),
      });

      persistSession(auth);
      setForms(current => ({ ...current, login: emptyForms.login }));
      showMessage('Signed in.', 'success');
      goToPage('account');
      await refreshSessionData();
    } catch (error) {
      handleError(error);
    } finally {
      setBusyAction('');
    }
  }

  async function handleLogout() {
    setBusyAction('logout');

    try {
      if (accessToken) {
        await request('/auth/logout', { method: 'POST' }, true);
      }

      clearSession();
      goToPage('home');
      showMessage('Signed out.', 'success');
    } catch (error) {
      handleError(error);
    } finally {
      setBusyAction('');
    }
  }

  async function handleTopUp(event) {
    event.preventDefault();
    setBusyAction('topup');

    try {
      const wallet = await request(
        '/wallet/top-up',
        {
          method: 'POST',
          body: JSON.stringify({
            amountCents: Number(forms.topUp.amountCents),
            description: forms.topUp.description,
          }),
        },
        true,
      );

      setWalletBalance(wallet.balanceCents);
      showMessage(`Баланс пополнен: ${wallet.balanceCents} ₽.`, 'success');
      await refreshSessionData();
    } catch (error) {
      handleError(error);
    } finally {
      setBusyAction('');
    }
  }

  async function handleCreateBook(event) {
    event.preventDefault();
    setBusyAction('create-book');

    try {
      await request('/books', {
        method: 'POST',
        body: JSON.stringify({
          ...forms.createBook,
          priceCents: Number(forms.createBook.priceCents),
          stock: Number(forms.createBook.stock),
          active: true,
        }),
      });

      setForms(current => ({ ...current, createBook: emptyForms.createBook }));
      showMessage('Book published in catalog.', 'success');
      await refreshBooks();
    } catch (error) {
      handleError(error);
    } finally {
      setBusyAction('');
    }
  }

  async function updateInventory(bookId) {
    setBusyAction(`inventory-${bookId}`);

    try {
      const draft = inventoryDrafts[bookId];
      await request(`/books/${bookId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          priceCents: Number(draft.priceCents),
          stock: Number(draft.stock),
        }),
      });

      showMessage(`Inventory updated for ${bookId}.`, 'success');
      await refreshBooks();
    } catch (error) {
      handleError(error);
    } finally {
      setBusyAction('');
    }
  }

  async function startPurchase(bookId, quantity, idempotencyKey) {
    if (!user) {
      showMessage('Войдите в тестовый аккаунт, чтобы оформить покупку.', 'error');
      goToPage('auth');
      return;
    }

    setBusyAction(`buy-${bookId}`);

    try {
      const operation = await request(
        '/book-purchase',
        {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            bookId,
            quantity: Number(quantity),
            paymentToken: 'tok_visa_test',
          }),
        },
        true,
      );

      setPurchaseStatus(`Operation ${operation.operationId} created. Polling status...`);
      await pollOrder(operation.operationId);
    } catch (error) {
      handleError(error);
    } finally {
      setBusyAction('');
    }
  }

  async function pollOrder(operationId) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await wait(800);
      const order = await request(`/orders/${operationId}`, {}, true);
      setPurchaseStatus(`Order ${operationId}: ${order.status}`);

      if (order.status !== 'PENDING') {
        showMessage(
          `Order ${order.book.title} finished with status ${order.status}.`,
          order.status === 'PAID' ? 'success' : 'error',
        );
        await refreshSessionData();
        return;
      }
    }

    showMessage('Order is still pending. Refresh later.', 'error');
  }

  function addToCart(bookId) {
    setCartItems(current => {
      const existing = current.find(item => item.bookId === bookId);

      if (existing) {
        return current.map(item =>
          item.bookId === bookId
            ? { ...item, quantity: Math.min(item.quantity + 1, 5) }
            : item,
        );
      }

      return [...current, { bookId, quantity: 1 }];
    });

    showMessage('Book added to cart.', 'success');
  }

  function updateCartQuantity(bookId, quantity) {
    setCartItems(current =>
      current
        .map(item =>
          item.bookId === bookId
            ? { ...item, quantity: Math.max(1, Math.min(5, quantity)) }
            : item,
        )
        .filter(item => item.quantity > 0),
    );
  }

  function removeFromCart(bookId) {
    setCartItems(current => current.filter(item => item.bookId !== bookId));
  }

  async function checkoutCart() {
    if (!cartItems.length) {
      showMessage('Cart is empty.', 'error');
      return;
    }

    if (!user) {
      showMessage('Войдите в тестовый аккаунт, чтобы оформить заказ.', 'error');
      goToPage('auth');
      return;
    }

    setBusyAction('checkout');

    try {
      for (const item of cartItems) {
        await startPurchase(
          item.bookId,
          item.quantity,
          buildIdempotencyKey(item.bookId),
        );
      }

      setCartItems([]);
      goToPage('account');
      showMessage('Cart checkout started.', 'success');
    } catch (error) {
      handleError(error);
    } finally {
      setBusyAction('');
    }
  }

  function openBook(bookId) {
    setSelectedBookId(bookId);
    goToPage('book');
  }

  return (
    <div className="shell">
      <div className="page-wrap">
        <Header
          activePage={activePage}
          cartCount={cartItems.length}
          onNavigate={goToPage}
          onNavigateCatalog={goToCatalog}
          catalogSection={catalogSection}
          onSearchChange={setSearch}
          search={search}
          user={user}
        />

        {activePage === 'home' && (
          <HomePage
            recentBooks={recentBooks}
            onOpenBook={openBook}
            onNavigateCatalog={goToCatalog}
            onAddToCart={addToCart}
          />
        )}

        {activePage === 'auth' && (
          <AuthPage
            forms={forms}
            busyAction={busyAction}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onSetFormValue={setFormValue}
          />
        )}

        {activePage === 'catalog' && (
          <CatalogPage
            books={filteredBooks}
            inventoryDrafts={inventoryDrafts}
            busyAction={busyAction}
            search={search}
            stockFilter={stockFilter}
            sortBy={sortBy}
            categories={catalogCategories}
            authors={catalogAuthors}
            catalogSection={catalogSection}
            categoryFilter={categoryFilter}
            authorFilter={authorFilter}
            user={user}
            forms={forms}
            onAddToCart={addToCart}
            onCreateBook={handleCreateBook}
            onOpenBook={openBook}
            onSetFormValue={setFormValue}
            onSetInventoryValue={setInventoryValue}
            onSetSortBy={setSortBy}
            onSetStockFilter={setStockFilter}
            onSetCategoryFilter={setCategoryFilter}
            onSetAuthorFilter={setAuthorFilter}
            onUpdateInventory={updateInventory}
          />
        )}

        {activePage === 'book' && selectedBook && (
          <BookPage
            book={selectedBook}
            recommendedBooks={recommendedBooks}
            busyAction={busyAction}
            user={user}
            onAddToCart={addToCart}
            onBuyNow={quantity =>
              startPurchase(
                selectedBook.id,
                quantity,
                buildIdempotencyKey(selectedBook.id),
              )
            }
            onOpenBook={openBook}
          />
        )}

        {activePage === 'cart' && (
          <CartPage
            books={books}
            busyAction={busyAction}
            cartItems={cartItems}
            total={cartTotal}
            user={user}
            onCheckout={checkoutCart}
            onOpenBook={openBook}
            onRemove={removeFromCart}
            onUpdateQuantity={updateCartQuantity}
          />
        )}

        {activePage === 'account' && (
          <AccountPage
            busyAction={busyAction}
            forms={forms}
            orders={orders}
            purchaseStatus={purchaseStatus}
            spentTotal={spentTotal}
            user={user}
            walletBalance={walletBalance}
            walletTransactions={walletTransactions}
            onSetFormValue={setFormValue}
            onTopUp={handleTopUp}
          />
        )}

        <footer className={`message-strip ${message.tone || ''}`}>
          {message.text}
        </footer>
      </div>
    </div>
  );
}

function Header({
  activePage,
  cartCount,
  catalogSection,
  onNavigate,
  onNavigateCatalog,
  onSearchChange,
  search,
  user,
}) {
  const navItems = [
    { id: 'catalog', label: 'Каталог' },
    { id: 'genres', label: 'Жанры' },
    { id: 'authors', label: 'Авторы' },
    { id: 'new', label: 'Новинки' },
    { id: 'sale', label: 'Акции' },
  ];

  return (
    <header className="store-header">
      <button className="brand" type="button" onClick={() => onNavigate('home')}>
        <span className="brand-icon">📚</span>
        <span>Bookish</span>
      </button>

      <nav className="main-nav">
        {navItems.map(item => (
          <button
            key={`${item.id}-${item.label}`}
            className={`nav-link ${activePage === 'catalog' && catalogSection === item.id ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigateCatalog(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="header-search">
        <input
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Поиск книг, авторов, жанров..."
        />
      </div>

      <div className="header-actions">
        <button className="icon-action" type="button" onClick={() => onNavigate('cart')}>
          Корзина
          {cartCount > 0 && <span className="counter">{cartCount}</span>}
        </button>
        <button
          className="icon-action"
          type="button"
          onClick={() => onNavigate(user ? 'account' : 'auth')}
        >
          {user ? 'Профиль' : 'Войти'}
        </button>
      </div>
    </header>
  );
}

function HomePage({ recentBooks, onAddToCart, onNavigateCatalog, onOpenBook }) {
  return (
    <section className="page-card">
      <div className="hero-block">
        <div className="hero-copy">
          <h1>Хорошие книги для яркой жизни</h1>
          <p>
            Откройте новые истории, знания и вдохновение. Тысячи книг в одном
            месте, а оплата и заказы уже встроены в кабинет.
          </p>
          <button className="primary-button" type="button" onClick={() => onNavigateCatalog('catalog')}>
            Смотреть каталог
          </button>
        </div>

        <div className="hero-illustration" aria-hidden="true">
          <div className="hero-blob" />
          <div className="book-stack">
            <span className="stack-book stack-book--green" />
            <span className="stack-book stack-book--gold" />
            <span className="stack-book stack-book--orange" />
            <span className="stack-book stack-book--dark" />
            <span className="stack-book stack-book--cream" />
          </div>
          <div className="cup" />
          <div className="plant">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className="feature-row">
        <FeatureCard title="Быстрая доставка" text="по всей стране" />
        <FeatureCard title="Безопасная оплата" text="удобным способом" />
        <FeatureCard title="Бонусы и скидки" text="постоянным клиентам" />
        <FeatureCard title="Поддержка 24/7" text="мы всегда на связи" />
      </div>

      <section className="shelf-section">
        <div className="section-title-row">
          <h2>Новинки</h2>
          <button className="text-link" type="button" onClick={() => onNavigateCatalog('new')}>
            Смотреть все
          </button>
        </div>
        <div className="book-row">
          {recentBooks.map(book => (
            <BookShelfCard
              key={book.id}
              book={book}
              onAddToCart={() => onAddToCart(book.id)}
              onOpenBook={() => onOpenBook(book.id)}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function AuthPage({ busyAction, forms, onLogin, onRegister, onSetFormValue }) {
  return (
    <section className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">
          <span className="brand-icon">📚</span>
          <strong>Bookish</strong>
        </div>

        <div className="auth-grid">
          <form className="auth-card" onSubmit={onLogin}>
            <h2>Добро пожаловать!</h2>
            <p>Тестовый доступ уже заполнен: demo@bookish.test / bookish123</p>
            <label>
              Email
              <input
                value={forms.login.email}
                onChange={event => onSetFormValue('login', 'email', event.target.value)}
                placeholder="Введите email"
                type="email"
                required
              />
            </label>
            <label>
              Пароль
              <input
                value={forms.login.password}
                onChange={event => onSetFormValue('login', 'password', event.target.value)}
                placeholder="Введите пароль"
                type="password"
                minLength="6"
                required
              />
            </label>
            <button
              className="primary-button primary-button--dark"
              type="submit"
              disabled={busyAction === 'login'}
            >
              Войти
            </button>
          </form>

          <form className="auth-card auth-card--soft" onSubmit={onRegister}>
            <h2>Регистрация</h2>
            <p>Создайте аккаунт для покупок и истории заказов</p>
            <label>
              Имя
              <input
                value={forms.register.name}
                onChange={event => onSetFormValue('register', 'name', event.target.value)}
                placeholder="Введите имя"
                required
              />
            </label>
            <label>
              Email
              <input
                value={forms.register.email}
                onChange={event => onSetFormValue('register', 'email', event.target.value)}
                placeholder="Введите email"
                type="email"
                required
              />
            </label>
            <label>
              Пароль
              <input
                value={forms.register.password}
                onChange={event =>
                  onSetFormValue('register', 'password', event.target.value)
                }
                placeholder="Минимум 6 символов"
                type="password"
                minLength="6"
                required
              />
            </label>
            <button
              className="primary-button"
              type="submit"
              disabled={busyAction === 'register'}
            >
              Зарегистрироваться
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function CatalogPage({
  authorFilter,
  authors,
  books,
  busyAction,
  catalogSection,
  categoryFilter,
  categories,
  forms,
  inventoryDrafts,
  onAddToCart,
  onCreateBook,
  onOpenBook,
  onSetFormValue,
  onSetAuthorFilter,
  onSetCategoryFilter,
  onSetInventoryValue,
  onSetSortBy,
  onSetStockFilter,
  onUpdateInventory,
  sortBy,
  stockFilter,
  user,
}) {
  const isAuthorSection = catalogSection === 'authors';
  const sidebarItems = isAuthorSection
    ? [{ value: 'all', label: 'Все авторы' }, ...authors.map(author => ({ value: author, label: author }))]
    : categories;
  const selectedFilter = isAuthorSection ? authorFilter : categoryFilter;

  return (
    <section className="page-card catalog-page">
      <aside className="catalog-sidebar">
        <div className="sidebar-block">
          <h3>{isAuthorSection ? 'Авторы' : 'Каталог'}</h3>
          <ul className="sidebar-list">
            {sidebarItems.map(item => (
              <li key={item.value}>
                <button
                  className={`sidebar-link ${selectedFilter === item.value ? 'active' : ''}`}
                  type="button"
                  onClick={() =>
                    isAuthorSection
                      ? onSetAuthorFilter(item.value)
                      : onSetCategoryFilter(item.value)
                  }
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-block">
          <h3>Фильтры</h3>
          <label className="sidebar-label">
            Наличие
            <select
              value={stockFilter}
              onChange={event => onSetStockFilter(event.target.value)}
            >
              <option value="all">Все книги</option>
              <option value="in-stock">В наличии</option>
              <option value="out-of-stock">Нет в наличии</option>
            </select>
          </label>
          <label className="sidebar-label">
            Сортировка
            <select value={sortBy} onChange={event => onSetSortBy(event.target.value)}>
              <option value="popular">По популярности</option>
              <option value="price-asc">Цена по возрастанию</option>
              <option value="price-desc">Цена по убыванию</option>
              <option value="title">По названию</option>
            </select>
          </label>
        </div>
      </aside>

      <div className="catalog-content">
        <div className="section-title-row">
          <div>
            <h2>{catalogSectionTitles[catalogSection]}</h2>
            <p className="subtle-text">Найдено {books.length} книг</p>
          </div>
        </div>

        <div className="catalog-grid">
          {books.map(book => (
            <article className="product-tile" key={book.id}>
              <button
                className="cover-button"
                type="button"
                onClick={() => onOpenBook(book.id)}
              >
                <BookCover book={book} />
              </button>
              <strong>{book.title}</strong>
              <span className="subtle-text">{book.author}</span>
              <div className="price-row">
                <span>{book.priceCents} ₽</span>
                <button
                  className="mini-cart-button"
                  type="button"
                  onClick={() => onAddToCart(book.id)}
                >
                  🛒
                </button>
              </div>

              {user && (
                <div className="inventory-mini">
                  <input
                    type="number"
                    min="1"
                    value={inventoryDrafts[book.id]?.priceCents || String(book.priceCents)}
                    onChange={event =>
                      onSetInventoryValue(book.id, 'priceCents', event.target.value)
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    value={inventoryDrafts[book.id]?.stock || String(book.stock)}
                    onChange={event =>
                      onSetInventoryValue(book.id, 'stock', event.target.value)
                    }
                  />
                  <button
                    className="mini-outline-button"
                    type="button"
                    disabled={busyAction === `inventory-${book.id}`}
                    onClick={() => onUpdateInventory(book.id)}
                  >
                    Обновить
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>

        {user && (
          <form className="inventory-create" onSubmit={onCreateBook}>
            <h3>Добавить книгу</h3>
            <div className="inventory-create-grid">
              <input
                value={forms.createBook.id}
                onChange={event => onSetFormValue('createBook', 'id', event.target.value)}
                placeholder="ID"
                required
              />
              <input
                value={forms.createBook.title}
                onChange={event => onSetFormValue('createBook', 'title', event.target.value)}
                placeholder="Название"
                required
              />
              <input
                value={forms.createBook.author}
                onChange={event => onSetFormValue('createBook', 'author', event.target.value)}
                placeholder="Автор"
                required
              />
              <input
                value={forms.createBook.categorySlug}
                onChange={event =>
                  onSetFormValue('createBook', 'categorySlug', event.target.value)
                }
                placeholder="Категория"
                required
              />
              <input
                value={forms.createBook.priceCents}
                onChange={event =>
                  onSetFormValue('createBook', 'priceCents', event.target.value)
                }
                type="number"
                min="1"
                placeholder="Цена"
                required
              />
              <input
                value={forms.createBook.stock}
                onChange={event => onSetFormValue('createBook', 'stock', event.target.value)}
                type="number"
                min="0"
                placeholder="Остаток"
                required
              />
            </div>
            <button className="primary-button primary-button--dark" type="submit">
              Опубликовать
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function BookPage({ book, busyAction, onAddToCart, onBuyNow, onOpenBook, recommendedBooks, user }) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [book.id]);

  return (
    <section className="page-card book-page">
      <div className="breadcrumbs">Главная / Каталог / {book.title}</div>

      <div className="book-layout">
        <div className="book-cover-large">
          <BookCover book={book} large />
        </div>

        <div className="book-info">
          <h2>{book.title}</h2>
          <p className="book-author">{book.author}</p>
          <div className="rating-row">
            <span>★ 4.8</span>
            <span className="subtle-text">(124 отзыва)</span>
          </div>
          <div className="tag-row">
            <span className="tag">Фантастика</span>
            <span className="tag">Классика</span>
          </div>
          <p className="book-description">
            Роман о далекой пустынной планете, борьбе за власть и судьбе
            молодого героя. Здесь это витринное описание, чтобы страница книги
            выглядела как полноценный storefront.
          </p>
          <dl className="book-meta">
            <div><dt>Год издания</dt><dd>1965</dd></div>
            <div><dt>Язык</dt><dd>Русский</dd></div>
            <div><dt>Страниц</dt><dd>544</dd></div>
            <div><dt>Переплет</dt><dd>Твердый</dd></div>
          </dl>
        </div>

        <aside className="buy-box">
          <div className="buy-price">{book.priceCents} ₽</div>
          <p className="stock-text">{book.stock > 0 ? 'В наличии' : 'Нет в наличии'}</p>
          <div className="quantity-picker">
            <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))}>
              −
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity(value => Math.min(5, value + 1))}>
              +
            </button>
          </div>
          <button
            className="primary-button primary-button--dark"
            type="button"
            onClick={() => onAddToCart(book.id)}
          >
            В корзину
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={book.stock === 0 || busyAction === `buy-${book.id}`}
            onClick={() => onBuyNow(quantity)}
          >
            {user ? 'Купить в 1 клик' : 'Войти и купить'}
          </button>
          <button className="ghost-text-button" type="button">
            ♡ В избранное
          </button>
        </aside>
      </div>

      <section className="related-section">
        <h3>Похожие книги</h3>
        <div className="book-row">
          {recommendedBooks.map(item => (
            <BookShelfCard
              key={item.id}
              book={item}
              compact
              onAddToCart={() => onAddToCart(item.id)}
              onOpenBook={() => onOpenBook(item.id)}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function CartPage({
  books,
  busyAction,
  cartItems,
  onCheckout,
  onOpenBook,
  onRemove,
  onUpdateQuantity,
  total,
  user,
}) {
  const cartBooks = cartItems
    .map(item => ({
      ...item,
      book: books.find(book => book.id === item.bookId),
    }))
    .filter(item => item.book);

  return (
    <section className="page-card cart-page">
      <div className="section-title-row">
        <div>
          <h2>Корзина</h2>
          <p className="subtle-text">{cartBooks.length} товара</p>
        </div>
      </div>

      <div className="cart-layout">
        <div className="cart-list">
          {cartBooks.length ? (
            cartBooks.map(item => (
              <div className="cart-item" key={item.bookId}>
                <button className="cart-cover" type="button" onClick={() => onOpenBook(item.bookId)}>
                  <BookCover book={item.book} />
                </button>
                <div className="cart-item__info">
                  <strong>{item.book.title}</strong>
                  <span className="subtle-text">{item.book.author}</span>
                </div>
                <div className="cart-item__controls">
                  <button type="button" onClick={() => onUpdateQuantity(item.bookId, item.quantity - 1)}>
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => onUpdateQuantity(item.bookId, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <div className="cart-item__price">{item.book.priceCents * item.quantity} ₽</div>
                <button className="ghost-text-button" type="button" onClick={() => onRemove(item.bookId)}>
                  Удалить
                </button>
              </div>
            ))
          ) : (
            <p className="empty-state">Корзина пуста.</p>
          )}
        </div>

        <aside className="cart-summary">
          <h3>Итого</h3>
          <p className="cart-summary__sum">{total} ₽</p>
          <button
            className="primary-button primary-button--dark"
            type="button"
            disabled={!cartBooks.length || busyAction === 'checkout'}
            onClick={() => void onCheckout()}
          >
            {user ? 'Оформить заказ' : 'Войти для покупки'}
          </button>
        </aside>
      </div>
    </section>
  );
}

function AccountPage({ busyAction, forms, orders, purchaseStatus, spentTotal, user, walletBalance, walletTransactions, onSetFormValue, onTopUp }) {
  return (
    <section className="page-card account-page">
      <aside className="account-menu">
        <button className="account-menu__item active" type="button">Профиль</button>
        <button className="account-menu__item" type="button">Заказы</button>
        <button className="account-menu__item" type="button">Избранное</button>
        <button className="account-menu__item" type="button">Баланс</button>
        <button className="account-menu__item" type="button">История операций</button>
      </aside>

      <div className="account-content">
        <div className="section-title-row">
          <div>
            <h2>Профиль</h2>
            <p className="subtle-text">Управление пользователем, балансом и заказами</p>
          </div>
        </div>

        <div className="account-header-card">
          <div className="profile-mini">
            <div className="avatar-circle">{(user?.name || 'U').slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{user?.name || 'Guest'}</strong>
              <span className="subtle-text">{user?.email || 'Войдите в аккаунт'}</span>
            </div>
          </div>
          <div className="balance-panel">
            <span className="subtle-text">Баланс</span>
            <strong>{walletBalance} ₽</strong>
          </div>
        </div>

        <div className="account-grid">
          <section className="account-card">
            <h3>Пополнить баланс</h3>
            <form className="topup-form" onSubmit={onTopUp}>
              <input
                value={forms.topUp.amountCents}
                onChange={event => onSetFormValue('topUp', 'amountCents', event.target.value)}
                type="number"
                min="1"
                placeholder="Сумма"
                required
              />
              <input
                value={forms.topUp.description}
                onChange={event => onSetFormValue('topUp', 'description', event.target.value)}
                placeholder="Описание"
              />
              <button className="primary-button" type="submit" disabled={!user || busyAction === 'topup'}>
                Пополнить баланс
              </button>
            </form>
            {purchaseStatus && <p className="subtle-text">{purchaseStatus}</p>}
          </section>

          <section className="account-card">
            <h3>Последние заказы</h3>
            <div className="history-list">
              {orders.length ? (
                orders.slice(0, 4).map(order => (
                  <div className="history-row" key={order.operationId}>
                    <div>
                      <strong>{order.book.title}</strong>
                      <span className="subtle-text">{order.createdAt.slice(0, 10)}</span>
                    </div>
                    <div className="history-row__meta">
                      <span>{order.amountCents} ₽</span>
                      <span className={order.status === 'PAID' ? 'ok-status' : 'warn-status'}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">Заказов пока нет.</p>
              )}
            </div>
          </section>

          <section className="account-card">
            <h3>История операций</h3>
            <div className="history-list">
              {walletTransactions.length ? (
                walletTransactions.slice(0, 5).map(transaction => (
                  <div className="history-row" key={transaction.id}>
                    <div>
                      <strong>{transaction.description}</strong>
                      <span className="subtle-text">{transaction.createdAt.slice(0, 10)}</span>
                    </div>
                    <div className="history-row__meta">
                      <span>{transaction.amountCents > 0 ? '+' : ''}{transaction.amountCents} ₽</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">Операций пока нет.</p>
              )}
            </div>
          </section>

          <section className="account-card account-card--stats">
            <h3>Статистика</h3>
            <div className="stats-row">
              <span>Потрачено всего</span>
              <strong>{spentTotal} ₽</strong>
            </div>
            <div className="stats-row">
              <span>Оплаченные заказы</span>
              <strong>{orders.filter(order => order.status === 'PAID').length}</strong>
            </div>
            <div className="stats-row">
              <span>Ожидают</span>
              <strong>{orders.filter(order => order.status === 'PENDING').length}</strong>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ text, title }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">◻</div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

function BookShelfCard({ book, compact = false, onAddToCart, onOpenBook }) {
  return (
    <article className={`shelf-book ${compact ? 'compact' : ''}`}>
      <button className="shelf-book__cover" type="button" onClick={onOpenBook}>
        <BookCover book={book} />
      </button>
      <strong>{book.title}</strong>
      <span className="subtle-text">{book.author}</span>
      <div className="shelf-book__footer">
        <span>{book.priceCents} ₽</span>
        <button className="mini-cart-button" type="button" onClick={onAddToCart}>
          🛒
        </button>
      </div>
    </article>
  );
}

function BookCover({ book, large = false }) {
  const palette = getBookPalette(book.id);

  return (
    <div
      className={`book-cover ${large ? 'large' : ''}`}
      style={{
        '--cover-start': palette.start,
        '--cover-end': palette.end,
        '--cover-ink': palette.ink,
      }}
    >
      <div className="book-cover__glow" />
      <div className="book-cover__text">
        <span>{book.author.split(' ')[0]}</span>
        <strong>{book.title}</strong>
      </div>
    </div>
  );
}

function getBookPalette(seed) {
  const palettes = [
    { start: '#2f1f57', end: '#57317d', ink: '#f5e7ad' },
    { start: '#f5e6c7', end: '#dfc08d', ink: '#6c4023' },
    { start: '#20373d', end: '#142127', ink: '#e4ddbc' },
    { start: '#3f241a', end: '#10151f', ink: '#f0bf6f' },
    { start: '#2d3d5b', end: '#1a2438', ink: '#f3d7ad' },
    { start: '#263d87', end: '#172454', ink: '#f7e39a' },
  ];

  return palettes[Math.abs(hashCode(seed)) % palettes.length];
}

function hashCode(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}

function buildIdempotencyKey(bookId) {
  return `buy-${bookId}-${Date.now()}`;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default App;
