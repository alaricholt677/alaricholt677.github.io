import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.imageio.ImageIO;

import java.awt.*;
import java.awt.event.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;

import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class Launcher extends JFrame {

    // --- Config ---
    private static final String DOWNLOAD_URL = "https://alaricholt677.github.io/downloads/irl.zip";
    private static final String NEWS_URL = "https://alaricholt677.github.io/news/news.json";

    private static final String JAR_NAME = "IRLSimulator.jar";
    private static final String BUILD_ID = "IRL-Launcher Build r12";

    private static final String EXPANSION_PACKS_DIR = "expansion_packs";
    private static final String CONFIGS_DIR = "configs";

    // --- Data files ---
    private static final String DATA_DIR = "launcher_data";
    private static final String PROFILE_FILE = "profile.dat";
    private static final String INSTALLATIONS_FILE = "installations.dat";
    private static final String SKINS_FILE = "skins.dat";
    private static final String SETTINGS_FILE = "settings.dat";

    // --- Colors ---
    private static final Color BG_DARK = new Color(24, 24, 24);
    private static final Color BG_MAIN = new Color(32, 32, 32);
    private static final Color BG_CARD = new Color(38, 38, 38);
    private static final Color BG_CARD_HOVER = new Color(50, 50, 50);
    private static final Color ACCENT = new Color(120, 200, 120);
    private static final Color ACCENT_ALT = new Color(150, 110, 220);
    private static final Color TEXT_PRIMARY = Color.WHITE;
    private static final Color TEXT_SECONDARY = new Color(180, 180, 180);

    // --- State ---
    private String currentUsername = "Grox";
    private boolean isSignedInWithMicrosoft = false;

    private DefaultListModel<Installation> installationModel = new DefaultListModel<>();
    private Installation activeInstallation;
    private JList<Installation> installationList;
    private JComboBox<Installation> playInstallationBox;

    private DefaultListModel<SkinEntry> skinModel = new DefaultListModel<>();
    private SkinEntry activeSkin;
    private JList<SkinEntry> skinList;
    private JLabel skinPreviewLabel;

    private DefaultListModel<ExpansionPack> expansionPackModel = new DefaultListModel<>();
    private JList<ExpansionPack> expansionPackList;

    private String lastTabKey = "play";
    private String lastPatchNotesVersion = "IRL Simulator 1.1.0 - The Grox Update";

    private JProgressBar progressBar;
    private JLabel statusLabel;
    private JLabel profileNameLabel;
    private JLabel profileTagLabel;

    private CardLayout centerCards;
    private JPanel centerCardContainer;

    private JButton playSideButton;
    private JButton homeSideButton;
    private JButton instSideButton;
    private JButton expansionSideButton;
    private JButton skinsSideButton;
    private JButton patchSideButton;
    private JButton settingsSideButton;
    private JButton aboutSideButton;

    private JComboBox<String> patchVersionBox;
    private JTextArea patchNotesArea;

    // Settings
    private boolean showLogWindowOnLaunch = true;
    private String languageCode = "en-US";

    private LogWindow currentLogWindow;

    private PrintStream originalOut;
    private PrintStream originalErr;

    // --- Entry point ---
    public static void main(String[] args) {
        Thread.setDefaultUncaughtExceptionHandler(new GlobalErrorHandler());

        SwingUtilities.invokeLater(() -> {
            try {
                Launcher launcher = new Launcher();
                launcher.setVisible(true);
            } catch (Throwable t) {
                Thread.UncaughtExceptionHandler h = Thread.getDefaultUncaughtExceptionHandler();
                if (h != null) h.uncaughtException(Thread.currentThread(), t);
                else t.printStackTrace();
            }
        });
    }

    public Launcher() {
        originalOut = System.out;
        originalErr = System.err;

        initDataDirs();

        loadProfile();
        loadSettings();
        loadInstallations();
        loadSkins();
        loadExpansionPacks();

        setupUI();
        applyLoadedState();

        addComponentListener(new ComponentAdapter() {
            @Override
            public void componentResized(ComponentEvent e) {
                saveSettings();
            }
        });
    }

    private void initDataDirs() {
        new File(DATA_DIR).mkdirs();
        new File(EXPANSION_PACKS_DIR).mkdirs();
        new File(CONFIGS_DIR).mkdirs();
        new File("skins/default").mkdirs();
        new File("skins/selected").mkdirs();
    }

    // --- UI setup ---
    private void setupUI() {
        setTitle("IRL Simulator Launcher");
        setSize(1150, 700);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());
        getContentPane().setBackground(BG_DARK);

        JPanel sidebar = createSidebar();
        add(sidebar, BorderLayout.WEST);

        JPanel mainArea = new DottedBackgroundPanel();
        mainArea.setLayout(new BorderLayout());
        mainArea.setBorder(new EmptyBorder(10, 10, 10, 10));
        add(mainArea, BorderLayout.CENTER);

        mainArea.add(createHeader(), BorderLayout.NORTH);

        centerCards = new CardLayout();
        centerCardContainer = new JPanel(centerCards);
        centerCardContainer.setOpaque(false);
        centerCardContainer.setBorder(new EmptyBorder(10, 10, 10, 10));

        centerCardContainer.add(createPlayPanel(), "play");
        centerCardContainer.add(createHomePanel(), "home");
        centerCardContainer.add(createInstallationsPanel(), "inst");
        centerCardContainer.add(createExpansionPacksPanel(), "packs");
        centerCardContainer.add(createSkinsPanel(), "skins");
        centerCardContainer.add(createPatchNotesPanel(), "patch");
        centerCardContainer.add(createSettingsPanel(), "settings");
        centerCardContainer.add(createAboutPanel(), "about");

        mainArea.add(centerCardContainer, BorderLayout.CENTER);
        mainArea.add(createBottomBar(), BorderLayout.SOUTH);

        playSideButton.addActionListener(e -> switchSection("play", playSideButton));
        homeSideButton.addActionListener(e -> switchSection("home", homeSideButton));
        instSideButton.addActionListener(e -> switchSection("inst", instSideButton));
        expansionSideButton.addActionListener(e -> switchSection("packs", expansionSideButton));
        skinsSideButton.addActionListener(e -> switchSection("skins", skinsSideButton));
        patchSideButton.addActionListener(e -> switchSection("patch", patchSideButton));
        settingsSideButton.addActionListener(e -> switchSection("settings", settingsSideButton));
        aboutSideButton.addActionListener(e -> switchSection("about", aboutSideButton));
    }

    private JPanel createSidebar() {
        JPanel sidebar = new JPanel(new BorderLayout());
        sidebar.setPreferredSize(new Dimension(230, 700));
        sidebar.setBackground(BG_DARK);

        JPanel logoPanel = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);

                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                GradientPaint gp = new GradientPaint(0, 0, ACCENT_ALT, getWidth(), getHeight(), ACCENT);
                g2.setPaint(gp);
                g2.fillRoundRect(10, 10, getWidth() - 20, getHeight() - 20, 18, 18);

                g2.setColor(new Color(0, 0, 0, 80));
                g2.fillRoundRect(18, 18, getWidth() - 36, getHeight() - 36, 14, 14);

                g2.setColor(Color.WHITE);
                g2.setFont(getFont().deriveFont(Font.BOLD, 18f));
                g2.drawString("IRL SIM", 26, 40);

                g2.setFont(getFont().deriveFont(Font.PLAIN, 11f));
                g2.drawString("Grox Official Launcher", 26, 58);

                g2.dispose();
            }
        };

        logoPanel.setOpaque(false);
        logoPanel.setPreferredSize(new Dimension(230, 90));
        sidebar.add(logoPanel, BorderLayout.NORTH);

        JPanel sideButtons = new JPanel();
        sideButtons.setOpaque(false);
        sideButtons.setLayout(new BoxLayout(sideButtons, BoxLayout.Y_AXIS));
        sideButtons.setBorder(new EmptyBorder(10, 10, 10, 10));

        playSideButton = createSidebarButton("PLAY", true);
        homeSideButton = createSidebarButton("HOME", false);
        instSideButton = createSidebarButton("INSTALLATIONS", false);
        expansionSideButton = createSidebarButton("EXPANSION PACKS", false);
        skinsSideButton = createSidebarButton("SKINS", false);
        patchSideButton = createSidebarButton("PATCH NOTES", false);
        settingsSideButton = createSidebarButton("SETTINGS", false);
        aboutSideButton = createSidebarButton("ABOUT", false);

        JButton[] buttons = {
                playSideButton,
                homeSideButton,
                instSideButton,
                expansionSideButton,
                skinsSideButton,
                patchSideButton,
                settingsSideButton,
                aboutSideButton
        };

        for (JButton b : buttons) {
            sideButtons.add(b);
            sideButtons.add(Box.createVerticalStrut(8));
        }

        sidebar.add(sideButtons, BorderLayout.CENTER);

        JPanel buildPanel = new JPanel(new BorderLayout());
        buildPanel.setOpaque(false);
        buildPanel.setBorder(new EmptyBorder(0, 10, 10, 10));

        JLabel buildLabel = new JLabel(BUILD_ID);
        buildLabel.setForeground(TEXT_SECONDARY);
        buildLabel.setFont(new Font("SansSerif", Font.PLAIN, 11));
        buildPanel.add(buildLabel, BorderLayout.WEST);

        profileTagLabel = new JLabel("PROFILE: " + currentUsername.toUpperCase());
        profileTagLabel.setForeground(ACCENT);
        profileTagLabel.setFont(new Font("Monospaced", Font.BOLD, 11));
        buildPanel.add(profileTagLabel, BorderLayout.EAST);

        sidebar.add(buildPanel, BorderLayout.SOUTH);

        return sidebar;
    }

    private JPanel createHeader() {
        JPanel header = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);

                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                g2.setColor(BG_MAIN);
                g2.fillRect(0, 0, getWidth(), getHeight());

                g2.setColor(new Color(0, 0, 0, 80));
                Polygon p = new Polygon();
                p.addPoint(0, getHeight());
                p.addPoint(getWidth() / 2, 0);
                p.addPoint(getWidth(), 0);
                p.addPoint(getWidth(), getHeight());
                g2.fillPolygon(p);

                g2.dispose();
            }
        };

        header.setPreferredSize(new Dimension(100, 70));
        header.setLayout(new BorderLayout());
        header.setBorder(new EmptyBorder(10, 20, 10, 20));

        JLabel titleLabel = new JLabel("IRL SIMULATOR LAUNCHER");
        titleLabel.setForeground(TEXT_PRIMARY);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 18));

        JLabel subtitleLabel = new JLabel("Grox Civilization Runtime");
        subtitleLabel.setForeground(TEXT_SECONDARY);
        subtitleLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JPanel titleBox = new JPanel();
        titleBox.setOpaque(false);
        titleBox.setLayout(new BoxLayout(titleBox, BoxLayout.Y_AXIS));
        titleBox.add(titleLabel);
        titleBox.add(subtitleLabel);

        header.add(titleBox, BorderLayout.WEST);

        statusLabel = new JLabel("Ready.");
        statusLabel.setForeground(ACCENT);
        statusLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));
        header.add(statusLabel, BorderLayout.EAST);

        return header;
    }

    private JPanel createBottomBar() {
        JPanel bottomBar = new JPanel(new BorderLayout());
        bottomBar.setBackground(BG_MAIN);
        bottomBar.setBorder(new EmptyBorder(8, 20, 8, 20));
        bottomBar.setPreferredSize(new Dimension(100, 70));

        JPanel userPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 0));
        userPanel.setOpaque(false);

        JPanel avatar = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                g.setColor(ACCENT_ALT);
                g.fillRoundRect(0, 0, getWidth(), getHeight(), 8, 8);
                g.setColor(new Color(0, 0, 0, 60));
                g.fillRoundRect(4, 4, getWidth() - 8, getHeight() - 8, 6, 6);
            }
        };

        avatar.setPreferredSize(new Dimension(40, 40));

        profileNameLabel = new JLabel(currentUsername);
        profileNameLabel.setForeground(TEXT_PRIMARY);
        profileNameLabel.setFont(new Font("SansSerif", Font.BOLD, 14));

        JLabel profileLabel = new JLabel("Microsoft Grox Profile (simulated)");
        profileLabel.setForeground(TEXT_SECONDARY);
        profileLabel.setFont(new Font("SansSerif", Font.PLAIN, 11));

        JPanel nameBox = new JPanel();
        nameBox.setOpaque(false);
        nameBox.setLayout(new BoxLayout(nameBox, BoxLayout.Y_AXIS));
        nameBox.add(profileNameLabel);
        nameBox.add(profileLabel);

        userPanel.add(avatar);
        userPanel.add(nameBox);

        bottomBar.add(userPanel, BorderLayout.WEST);

        progressBar = new JProgressBar(0, 100);
        progressBar.setVisible(false);
        progressBar.setStringPainted(true);
        progressBar.setForeground(ACCENT);
        progressBar.setBackground(new Color(40, 40, 40));

        bottomBar.add(progressBar, BorderLayout.CENTER);

        JLabel hint = new JLabel("Play button moved to PLAY tab");
        hint.setForeground(TEXT_SECONDARY);
        hint.setFont(new Font("SansSerif", Font.PLAIN, 11));
        bottomBar.add(hint, BorderLayout.EAST);

        return bottomBar;
    }

    private void applyLoadedState() {
        if (installationModel.isEmpty()) {
            installationModel.addElement(new Installation("IRL Simulator - Default", "1.1.0", JAR_NAME));
        }

        if (activeInstallation == null && installationModel.getSize() > 0) {
            activeInstallation = installationModel.getElementAt(0);
        }

        if (installationList != null && activeInstallation != null) {
            installationList.setSelectedValue(activeInstallation, true);
        }

        refreshPlayInstallationBox();

        if (activeSkin == null && skinModel.getSize() > 0) {
            activeSkin = skinModel.getElementAt(0);
        }

        if (skinList != null && activeSkin != null) {
            skinList.setSelectedValue(activeSkin, true);
            updateSkinPreview();
        }

        if (patchVersionBox != null && lastPatchNotesVersion != null) {
            patchVersionBox.setSelectedItem(lastPatchNotesVersion);
        }

        JButton target = playSideButton;

        if ("home".equals(lastTabKey)) target = homeSideButton;
        else if ("inst".equals(lastTabKey)) target = instSideButton;
        else if ("packs".equals(lastTabKey)) target = expansionSideButton;
        else if ("skins".equals(lastTabKey)) target = skinsSideButton;
        else if ("patch".equals(lastTabKey)) target = patchSideButton;
        else if ("settings".equals(lastTabKey)) target = settingsSideButton;
        else if ("about".equals(lastTabKey)) target = aboutSideButton;
        else lastTabKey = "play";

        switchSection(lastTabKey, target);
    }

    private JButton createSidebarButton(String text, boolean active) {
        JButton b = new JButton(text);

        b.setFocusPainted(false);
        b.setContentAreaFilled(false);
        b.setBorderPainted(false);
        b.setHorizontalAlignment(SwingConstants.LEFT);
        b.setBorder(new EmptyBorder(6, 14, 6, 14));
        b.setFont(new Font("SansSerif", active ? Font.BOLD : Font.PLAIN, 13));
        b.setForeground(active ? TEXT_PRIMARY : TEXT_SECONDARY);

        if (active) {
            b.setOpaque(true);
            b.setBackground(new Color(50, 50, 50));
        } else {
            b.setOpaque(false);
        }

        return b;
    }

    private void switchSection(String key, JButton activeButton) {
        lastTabKey = key;
        centerCards.show(centerCardContainer, key);

        JButton[] all = {
                playSideButton,
                homeSideButton,
                instSideButton,
                expansionSideButton,
                skinsSideButton,
                patchSideButton,
                settingsSideButton,
                aboutSideButton
        };

        for (JButton b : all) {
            if (b == activeButton) {
                b.setForeground(TEXT_PRIMARY);
                b.setFont(new Font("SansSerif", Font.BOLD, 13));
                b.setOpaque(true);
                b.setBackground(new Color(50, 50, 50));
            } else {
                b.setForeground(TEXT_SECONDARY);
                b.setFont(new Font("SansSerif", Font.PLAIN, 13));
                b.setOpaque(false);
            }
        }

        saveSettings();
    }

    // --- PLAY Panel ---
    private JPanel createPlayPanel() {
        JPanel panel = new JPanel(new BorderLayout(12, 12));
        panel.setOpaque(false);

        JPanel left = new JPanel(new BorderLayout(10, 10));
        left.setOpaque(false);

        JPanel playCard = new JPanel();
        playCard.setBackground(BG_CARD);
        playCard.setBorder(new EmptyBorder(22, 22, 22, 22));
        playCard.setLayout(new BoxLayout(playCard, BoxLayout.Y_AXIS));

        JLabel title = new JLabel("PLAY IRL SIMULATOR");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 20));

        JLabel subtitle = new JLabel("Choose an installation, then launch with its version credentials.");
        subtitle.setForeground(TEXT_SECONDARY);
        subtitle.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JPanel installRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        installRow.setOpaque(false);

        JLabel installLabel = new JLabel("Installation:");
        installLabel.setForeground(TEXT_PRIMARY);

        playInstallationBox = new JComboBox<>();
        playInstallationBox.setPreferredSize(new Dimension(360, 28));

        installRow.add(installLabel);
        installRow.add(playInstallationBox);

        JLabel profileInfo = new JLabel("Profile: " + currentUsername);
        profileInfo.setForeground(TEXT_SECONDARY);
        profileInfo.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JLabel skinInfo = new JLabel("Skin: " + (activeSkin == null ? "Default" : activeSkin.name));
        skinInfo.setForeground(TEXT_SECONDARY);
        skinInfo.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JButton bigPlayButton = createBigPlayButton();
        bigPlayButton.addActionListener(e -> {
            Installation selected = (Installation) playInstallationBox.getSelectedItem();

            if (selected == null) {
                JOptionPane.showMessageDialog(
                        this,
                        "No installation selected.",
                        "Play",
                        JOptionPane.WARNING_MESSAGE
                );
                return;
            }

            activeInstallation = selected;

            if (installationList != null) {
                installationList.setSelectedValue(activeInstallation, true);
            }

            saveSettings();
            startLaunchThread();
        });

        JPanel playButtonCenter = new JPanel(new FlowLayout(FlowLayout.CENTER, 0, 0));
        playButtonCenter.setOpaque(false);
        playButtonCenter.add(bigPlayButton);

        playCard.add(title);
        playCard.add(Box.createVerticalStrut(4));
        playCard.add(subtitle);
        playCard.add(Box.createVerticalStrut(18));
        playCard.add(installRow);
        playCard.add(Box.createVerticalStrut(12));
        playCard.add(profileInfo);
        playCard.add(Box.createVerticalStrut(4));
        playCard.add(skinInfo);
        playCard.add(Box.createVerticalStrut(26));
        playCard.add(playButtonCenter);

        left.add(playCard, BorderLayout.CENTER);
        left.add(createWorldsPanel(), BorderLayout.SOUTH);

        JPanel newsPanel = createNewsPanel();

        panel.add(left, BorderLayout.CENTER);
        panel.add(newsPanel, BorderLayout.EAST);

        return panel;
    }

    private JButton createBigPlayButton() {
        JButton playButton = new JButton("     PLAY     ") {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();

                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                Color base = getModel().isRollover() ? ACCENT_ALT : ACCENT;
                g2.setColor(base);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 40, 40);

                g2.setColor(new Color(0, 0, 0, 65));
                g2.drawRoundRect(1, 1, getWidth() - 3, getHeight() - 3, 38, 38);

                int cx = 28;
                int cy = getHeight() / 2;

                Polygon tri = new Polygon();
                tri.addPoint(cx - 5, cy - 9);
                tri.addPoint(cx - 5, cy + 9);
                tri.addPoint(cx + 8, cy);

                g2.setColor(Color.WHITE);
                g2.fillPolygon(tri);

                g2.dispose();

                super.paintComponent(g);
            }
        };

        playButton.setFont(new Font("SansSerif", Font.BOLD, 20));
        playButton.setForeground(Color.WHITE);
        playButton.setContentAreaFilled(false);
        playButton.setFocusPainted(false);
        playButton.setBorderPainted(false);
        playButton.setPreferredSize(new Dimension(210, 56));
        playButton.setHorizontalAlignment(SwingConstants.CENTER);

        return playButton;
    }

    private void refreshPlayInstallationBox() {
        if (playInstallationBox == null) return;

        playInstallationBox.removeAllItems();

        for (int i = 0; i < installationModel.size(); i++) {
            playInstallationBox.addItem(installationModel.get(i));
        }

        if (activeInstallation != null) {
            playInstallationBox.setSelectedItem(activeInstallation);
        } else if (playInstallationBox.getItemCount() > 0) {
            playInstallationBox.setSelectedIndex(0);
            activeInstallation = (Installation) playInstallationBox.getSelectedItem();
        }
    }

    // --- Worlds row ---
    private JPanel createWorldsPanel() {
        JPanel outer = new JPanel(new BorderLayout());
        outer.setOpaque(false);

        JLabel title = new JLabel("WORLDS FROM configs/");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 13));

        outer.add(title, BorderLayout.NORTH);

        JPanel row = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 10));
        row.setOpaque(false);

        List<File> worlds = scanWorldFolders();

        if (worlds.isEmpty()) {
            JLabel empty = new JLabel("No world folders found in configs/");
            empty.setForeground(TEXT_SECONDARY);
            empty.setBorder(new EmptyBorder(20, 10, 20, 10));
            row.add(empty);
        } else {
            for (File world : worlds) {
                row.add(new WorldCard(world.getName()));
            }
        }

        JScrollPane scroll = new JScrollPane(
                row,
                JScrollPane.VERTICAL_SCROLLBAR_NEVER,
                JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED
        );

        scroll.setOpaque(false);
        scroll.getViewport().setOpaque(false);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        scroll.setPreferredSize(new Dimension(100, 130));

        outer.add(scroll, BorderLayout.CENTER);

        return outer;
    }

    private List<File> scanWorldFolders() {
        List<File> result = new ArrayList<>();
        File dir = new File(CONFIGS_DIR);

        if (!dir.exists()) dir.mkdirs();

        File[] files = dir.listFiles();

        if (files == null) return result;

        for (File f : files) {
            if (f.isDirectory()) {
                result.add(f);
            }
        }

        return result;
    }

    private static class WorldCard extends JPanel {
        private final String worldName;
        private boolean hover = false;

        WorldCard(String worldName) {
            this.worldName = worldName;

            setOpaque(false);
            setPreferredSize(new Dimension(150, 90));
            setCursor(Cursor.getDefaultCursor());
            setToolTipText(worldName);

            addMouseListener(new MouseAdapter() {
                @Override
                public void mouseEntered(MouseEvent e) {
                    hover = true;
                    setPreferredSize(new Dimension(170, 104));
                    revalidate();
                    repaint();
                }

                @Override
                public void mouseExited(MouseEvent e) {
                    hover = false;
                    setPreferredSize(new Dimension(150, 90));
                    revalidate();
                    repaint();
                }
            });
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);

            Graphics2D g2 = (Graphics2D) g.create();

            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            Color bg = hover ? BG_CARD_HOVER : BG_CARD;

            g2.setColor(bg);
            g2.fillRoundRect(0, 0, getWidth() - 1, getHeight() - 1, 18, 18);

            g2.setColor(new Color(0, 0, 0, 80));
            g2.drawRoundRect(0, 0, getWidth() - 2, getHeight() - 2, 18, 18);

            GradientPaint gp = new GradientPaint(0, 0, ACCENT_ALT, getWidth(), getHeight(), ACCENT);
            g2.setPaint(gp);
            g2.fillRoundRect(12, 12, getWidth() - 24, 30, 12, 12);

            g2.setColor(Color.WHITE);
            g2.setFont(new Font("SansSerif", Font.BOLD, 12));
            drawClippedString(g2, worldName, 12, 62, getWidth() - 24);

            g2.setColor(TEXT_SECONDARY);
            g2.setFont(new Font("SansSerif", Font.PLAIN, 10));
            g2.drawString("World config", 12, 78);

            g2.dispose();
        }

        private void drawClippedString(Graphics2D g2, String text, int x, int y, int maxWidth) {
            FontMetrics fm = g2.getFontMetrics();

            if (fm.stringWidth(text) <= maxWidth) {
                g2.drawString(text, x, y);
                return;
            }

            String ellipsis = "...";
            String clipped = text;

            while (clipped.length() > 0 && fm.stringWidth(clipped + ellipsis) > maxWidth) {
                clipped = clipped.substring(0, clipped.length() - 1);
            }

            g2.drawString(clipped + ellipsis, x, y);
        }
    }

    // --- News panel ---
    private JPanel createNewsPanel() {
        JPanel outer = new JPanel(new BorderLayout());
        outer.setBackground(BG_CARD);
        outer.setBorder(new EmptyBorder(14, 14, 14, 14));
        outer.setPreferredSize(new Dimension(360, 100));

        JLabel title = new JLabel("NEWS");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 14));
        outer.add(title, BorderLayout.NORTH);

        JPanel articlesPanel = new JPanel();
        articlesPanel.setBackground(BG_CARD);
        articlesPanel.setLayout(new BoxLayout(articlesPanel, BoxLayout.Y_AXIS));

        JLabel loading = new JLabel("Loading news...");
        loading.setForeground(TEXT_SECONDARY);
        loading.setBorder(new EmptyBorder(12, 0, 12, 0));
        articlesPanel.add(loading);

        JScrollPane scroll = new JScrollPane(articlesPanel);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        scroll.getViewport().setBackground(BG_CARD);

        outer.add(scroll, BorderLayout.CENTER);

        JButton refresh = new JButton("Refresh News");
        refresh.setFocusPainted(false);
        refresh.addActionListener(e -> loadNewsAsync(articlesPanel));

        outer.add(refresh, BorderLayout.SOUTH);

        loadNewsAsync(articlesPanel);

        return outer;
    }

    private void loadNewsAsync(JPanel articlesPanel) {
        articlesPanel.removeAll();

        JLabel loading = new JLabel("Loading news...");
        loading.setForeground(TEXT_SECONDARY);
        loading.setBorder(new EmptyBorder(12, 0, 12, 0));
        articlesPanel.add(loading);

        articlesPanel.revalidate();
        articlesPanel.repaint();

        Thread t = new Thread(() -> {
            List<NewsArticle> articles;

            try {
                articles = fetchNewsArticles();
            } catch (Throwable t1) {
                articles = fallbackNewsArticles();
            }

            List<NewsArticle> finalArticles = articles;

            SwingUtilities.invokeLater(() -> {
                articlesPanel.removeAll();

                if (finalArticles.isEmpty()) {
                    JLabel empty = new JLabel("No news articles found.");
                    empty.setForeground(TEXT_SECONDARY);
                    empty.setBorder(new EmptyBorder(12, 0, 12, 0));
                    articlesPanel.add(empty);
                } else {
                    for (NewsArticle article : finalArticles) {
                        articlesPanel.add(createNewsCard(article));
                        articlesPanel.add(Box.createVerticalStrut(10));
                    }
                }

                articlesPanel.revalidate();
                articlesPanel.repaint();
            });
        }, "IRL-News-Loader");

        t.setDaemon(true);
        t.start();
    }

    private List<NewsArticle> fetchNewsArticles() throws IOException {
        String json;

        try (InputStream in = new URL(NEWS_URL).openStream()) {
            json = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }

        return parseNewsArticles(json);
    }

    private List<NewsArticle> parseNewsArticles(String json) {
        List<NewsArticle> articles = new ArrayList<>();

        Pattern objectPattern = Pattern.compile("\\{\\s*\"id\"\\s*:\\s*\"(.*?)\"(.*?)\\}", Pattern.DOTALL);
        Matcher matcher = objectPattern.matcher(json);

        while (matcher.find()) {
            String obj = matcher.group(0);

            String id = extractJsonString(obj, "id");
            String name = extractJsonString(obj, "name");
            String imageURL = extractJsonString(obj, "imageURL");
            String content = extractJsonString(obj, "content");
            String date = extractJsonString(obj, "date");

            if (name != null && content != null) {
                articles.add(new NewsArticle(
                        nullToEmpty(id),
                        nullToEmpty(name),
                        cleanUrl(nullToEmpty(imageURL)),
                        nullToEmpty(content),
                        nullToEmpty(date)
                ));
            }
        }

        return articles;
    }

    private String extractJsonString(String obj, String key) {
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"((?:\\\\.|[^\"])*)\"", Pattern.DOTALL);
        Matcher m = p.matcher(obj);

        if (m.find()) {
            return unescapeJson(m.group(1));
        }

        return null;
    }

    private String unescapeJson(String s) {
        return s
                .replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t");
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private String cleanUrl(String s) {
        if (s == null) return "";

        int idx = s.indexOf("https://");
        if (idx >= 0) {
            String sub = s.substring(idx);
            int quote = sub.indexOf("\"");
            int comma = sub.indexOf(",");

            int end = -1;

            if (quote >= 0) end = quote;
            if (comma >= 0 && (end < 0 || comma < end)) end = comma;

            if (end >= 0) sub = sub.substring(0, end);

            return sub.trim();
        }

        return s.trim();
    }

    private JPanel createNewsCard(NewsArticle article) {
        JPanel card = new JPanel(new BorderLayout(8, 8));
        card.setBackground(new Color(24, 24, 24));
        card.setBorder(new EmptyBorder(10, 10, 10, 10));

        JLabel imageLabel = new JLabel();
        imageLabel.setPreferredSize(new Dimension(72, 72));
        imageLabel.setHorizontalAlignment(SwingConstants.CENTER);
        imageLabel.setVerticalAlignment(SwingConstants.CENTER);
        imageLabel.setOpaque(true);
        imageLabel.setBackground(new Color(45, 45, 45));
        imageLabel.setForeground(TEXT_SECONDARY);
        imageLabel.setText("IMG");

        if (!article.imageURL.isEmpty()) {
            loadImageAsync(article.imageURL, imageLabel, 72, 72);
        }

        JPanel textBox = new JPanel();
        textBox.setOpaque(false);
        textBox.setLayout(new BoxLayout(textBox, BoxLayout.Y_AXIS));

        JLabel name = new JLabel("<html><b>" + html(article.name) + "</b></html>");
        name.setForeground(TEXT_PRIMARY);
        name.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JLabel date = new JLabel(article.date);
        date.setForeground(ACCENT);
        date.setFont(new Font("SansSerif", Font.PLAIN, 10));

        JTextArea content = new JTextArea(article.content);
        content.setEditable(false);
        content.setOpaque(false);
        content.setForeground(TEXT_SECONDARY);
        content.setFont(new Font("SansSerif", Font.PLAIN, 11));
        content.setLineWrap(true);
        content.setWrapStyleWord(true);
        content.setRows(5);

        textBox.add(name);
        textBox.add(Box.createVerticalStrut(2));
        textBox.add(date);
        textBox.add(Box.createVerticalStrut(6));
        textBox.add(content);

        card.add(imageLabel, BorderLayout.WEST);
        card.add(textBox, BorderLayout.CENTER);

        return card;
    }

    private void loadImageAsync(String url, JLabel target, int w, int h) {
        Thread t = new Thread(() -> {
            try {
                BufferedImage img = ImageIO.read(new URL(url));

                if (img != null) {
                    Image scaled = img.getScaledInstance(w, h, Image.SCALE_SMOOTH);

                    SwingUtilities.invokeLater(() -> {
                        target.setText("");
                        target.setIcon(new ImageIcon(scaled));
                    });
                }
            } catch (Throwable ignored) {
                SwingUtilities.invokeLater(() -> target.setText("IMG"));
            }
        }, "IRL-News-Image");

        t.setDaemon(true);
        t.start();
    }

    private String html(String s) {
        return s
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private List<NewsArticle> fallbackNewsArticles() {
        List<NewsArticle> list = new ArrayList<>();

        list.add(new NewsArticle(
                "offline",
                "News unavailable",
                "",
                "Could not load news.json. Check your internet connection or the news URL.",
                ""
        ));

        return list;
    }

    // --- Home Panel ---
    private JPanel createHomePanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel();
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(20, 20, 20, 20));
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));

        JLabel title = new JLabel("THE GROX UPDATE");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 18));

        JLabel subtitle = new JLabel("New official launcher handles files, worlds, packs, news, and launching.");
        subtitle.setForeground(TEXT_SECONDARY);
        subtitle.setFont(new Font("SansSerif", Font.PLAIN, 13));

        JTextArea body = new JTextArea(
                "• PLAY tab now contains the installation dropdown and launch button\n" +
                "• Expansion packs are scanned from expansion_packs/\n" +
                "• Worlds are scanned from configs/ and shown as hover cards\n" +
                "• News loads from alaricholt677.github.io/news/news.json\n\n" +
                "Use the PLAY tab to choose a version and start the simulator."
        );

        body.setEditable(false);
        body.setOpaque(false);
        body.setForeground(TEXT_SECONDARY);
        body.setFont(new Font("SansSerif", Font.PLAIN, 13));
        body.setLineWrap(true);
        body.setWrapStyleWord(true);

        card.add(title);
        card.add(Box.createVerticalStrut(4));
        card.add(subtitle);
        card.add(Box.createVerticalStrut(12));
        card.add(body);

        panel.add(card, BorderLayout.CENTER);

        return panel;
    }

    // --- Installations Panel ---
    private JPanel createInstallationsPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel(new BorderLayout());
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(16, 16, 16, 16));

        JLabel title = new JLabel("INSTALLATIONS");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 14));
        card.add(title, BorderLayout.NORTH);

        if (installationModel.isEmpty()) {
            installationModel.addElement(new Installation("IRL Simulator - Default", "1.1.0", JAR_NAME));
        }

        installationList = new JList<>(installationModel);
        installationList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        installationList.setBackground(new Color(20, 20, 20));
        installationList.setForeground(TEXT_PRIMARY);
        installationList.setFont(new Font("SansSerif", Font.PLAIN, 12));
        installationList.setBorder(new EmptyBorder(4, 4, 4, 4));
        installationList.setSelectedIndex(0);

        card.add(new JScrollPane(installationList), BorderLayout.CENTER);

        JPanel bottom = new JPanel(new BorderLayout());
        bottom.setOpaque(false);
        bottom.setBorder(new EmptyBorder(8, 0, 0, 0));

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        buttons.setOpaque(false);

        JButton addBtn = new JButton("New");
        JButton editBtn = new JButton("Edit");
        JButton delBtn = new JButton("Delete");
        JButton setActiveBtn = new JButton("Set Active");

        for (JButton b : new JButton[]{addBtn, editBtn, delBtn, setActiveBtn}) {
            b.setFocusPainted(false);
            b.setFont(new Font("SansSerif", Font.PLAIN, 11));
        }

        addBtn.addActionListener(e -> {
            safeRun(this::addInstallation);
            saveInstallations();
            refreshPlayInstallationBox();
        });

        editBtn.addActionListener(e -> {
            safeRun(this::editInstallation);
            saveInstallations();
            refreshPlayInstallationBox();
        });

        delBtn.addActionListener(e -> {
            safeRun(this::deleteInstallation);
            saveInstallations();
            refreshPlayInstallationBox();
        });

        setActiveBtn.addActionListener(e -> {
            safeRun(this::setActiveInstallation);
            saveSettings();
            refreshPlayInstallationBox();
        });

        buttons.add(addBtn);
        buttons.add(editBtn);
        buttons.add(delBtn);
        buttons.add(setActiveBtn);

        JPanel msPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 6, 0));
        msPanel.setOpaque(false);

        JButton msSignInButton = new JButton("Sign in with Microsoft");
        msSignInButton.setFocusPainted(false);
        msSignInButton.setBackground(new Color(0, 120, 215));
        msSignInButton.setForeground(Color.WHITE);
        msSignInButton.setFont(new Font("SansSerif", Font.BOLD, 11));
        msSignInButton.setBorder(BorderFactory.createEmptyBorder(6, 10, 6, 10));
        msSignInButton.addActionListener(e -> {
            safeRun(this::simulateMicrosoftSignIn);
            saveProfile();
        });

        msPanel.add(msSignInButton);

        bottom.add(buttons, BorderLayout.WEST);
        bottom.add(msPanel, BorderLayout.EAST);

        card.add(bottom, BorderLayout.SOUTH);

        panel.add(card, BorderLayout.CENTER);

        return panel;
    }

    private void addInstallation() {
        JTextField nameField = new JTextField("New Installation");
        JTextField versionField = new JTextField("1.1.0");
        JTextField pathField = new JTextField(JAR_NAME);

        JPanel p = new JPanel(new GridLayout(0, 1, 4, 4));
        p.add(new JLabel("Name:"));
        p.add(nameField);
        p.add(new JLabel("Version:"));
        p.add(versionField);
        p.add(new JLabel("Jar Path:"));
        p.add(pathField);

        int res = JOptionPane.showConfirmDialog(
                this,
                p,
                "Create Installation",
                JOptionPane.OK_CANCEL_OPTION,
                JOptionPane.PLAIN_MESSAGE
        );

        if (res == JOptionPane.OK_OPTION) {
            Installation inst = new Installation(
                    nameField.getText().trim(),
                    versionField.getText().trim(),
                    pathField.getText().trim()
            );

            installationModel.addElement(inst);
            activeInstallation = inst;
        }
    }

    private void editInstallation() {
        Installation inst = installationList.getSelectedValue();
        if (inst == null) return;

        JTextField nameField = new JTextField(inst.name);
        JTextField versionField = new JTextField(inst.version);
        JTextField pathField = new JTextField(inst.path);

        JPanel p = new JPanel(new GridLayout(0, 1, 4, 4));
        p.add(new JLabel("Name:"));
        p.add(nameField);
        p.add(new JLabel("Version:"));
        p.add(versionField);
        p.add(new JLabel("Jar Path:"));
        p.add(pathField);

        int res = JOptionPane.showConfirmDialog(
                this,
                p,
                "Edit Installation",
                JOptionPane.OK_CANCEL_OPTION,
                JOptionPane.PLAIN_MESSAGE
        );

        if (res == JOptionPane.OK_OPTION) {
            inst.name = nameField.getText().trim();
            inst.version = versionField.getText().trim();
            inst.path = pathField.getText().trim();

            installationList.repaint();
        }
    }

    private void deleteInstallation() {
        Installation inst = installationList.getSelectedValue();
        if (inst == null) return;

        int res = JOptionPane.showConfirmDialog(
                this,
                "Delete installation \"" + inst.name + "\"?",
                "Delete Installation",
                JOptionPane.YES_NO_OPTION
        );

        if (res == JOptionPane.YES_OPTION) {
            installationModel.removeElement(inst);

            if (inst == activeInstallation) {
                activeInstallation = installationModel.isEmpty() ? null : installationModel.getElementAt(0);
                setStatus("Active installation changed.");
            }
        }
    }

    private void setActiveInstallation() {
        Installation inst = installationList.getSelectedValue();
        if (inst == null) return;

        activeInstallation = inst;
        setStatus("Active installation set to: " + inst.name);
    }

    private void simulateMicrosoftSignIn() {
        String name = JOptionPane.showInputDialog(this, "Enter Microsoft profile name:", currentUsername);

        if (name != null && !name.trim().isEmpty()) {
            currentUsername = name.trim();
            isSignedInWithMicrosoft = true;

            profileNameLabel.setText(currentUsername);
            profileTagLabel.setText("PROFILE: " + currentUsername.toUpperCase());

            setStatus("Signed in as " + currentUsername + " (simulated)");
        }
    }

    // --- Expansion Packs Panel ---
    private JPanel createExpansionPacksPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel(new BorderLayout());
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(16, 16, 16, 16));

        JLabel title = new JLabel("EXPANSION PACKS");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 14));
        card.add(title, BorderLayout.NORTH);

        expansionPackList = new JList<>(expansionPackModel);
        expansionPackList.setBackground(new Color(20, 20, 20));
        expansionPackList.setForeground(TEXT_PRIMARY);
        expansionPackList.setFont(new Font("SansSerif", Font.PLAIN, 12));
        expansionPackList.setBorder(new EmptyBorder(4, 4, 4, 4));

        card.add(new JScrollPane(expansionPackList), BorderLayout.CENTER);

        JPanel bottom = new JPanel(new BorderLayout());
        bottom.setOpaque(false);
        bottom.setBorder(new EmptyBorder(8, 0, 0, 0));

        JLabel hint = new JLabel("Put .zip files inside expansion_packs/ and press Refresh.");
        hint.setForeground(TEXT_SECONDARY);
        hint.setFont(new Font("SansSerif", Font.PLAIN, 11));

        JButton refresh = new JButton("Refresh");
        refresh.setFocusPainted(false);
        refresh.addActionListener(e -> {
            loadExpansionPacks();
            setStatus("Expansion packs refreshed.");
        });

        bottom.add(hint, BorderLayout.WEST);
        bottom.add(refresh, BorderLayout.EAST);

        card.add(bottom, BorderLayout.SOUTH);

        panel.add(card, BorderLayout.CENTER);

        return panel;
    }

    private void loadExpansionPacks() {
        expansionPackModel.clear();

        File dir = new File(EXPANSION_PACKS_DIR);

        if (!dir.exists()) dir.mkdirs();

        File[] files = dir.listFiles((d, name) -> name.toLowerCase().endsWith(".zip"));

        if (files == null || files.length == 0) {
            return;
        }

        for (File f : files) {
            expansionPackModel.addElement(new ExpansionPack(f.getName(), f.getAbsolutePath(), f.length()));
        }
    }

    // --- Skins Panel ---
    private JPanel createSkinsPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel(new BorderLayout());
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(16, 16, 16, 16));

        JLabel title = new JLabel("SKINS");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 14));
        card.add(title, BorderLayout.NORTH);

        if (skinModel.isEmpty()) {
            skinModel.addElement(new SkinEntry("Revenge Purple Block (default)", null));
        }

        skinList = new JList<>(skinModel);
        skinList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        skinList.setBackground(new Color(20, 20, 20));
        skinList.setForeground(TEXT_PRIMARY);
        skinList.setFont(new Font("SansSerif", Font.PLAIN, 12));
        skinList.setBorder(new EmptyBorder(4, 4, 4, 4));
        skinList.setSelectedIndex(0);

        JPanel left = new JPanel(new BorderLayout());
        left.setOpaque(false);
        left.add(new JScrollPane(skinList), BorderLayout.CENTER);

        JPanel leftButtons = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 4));
        leftButtons.setOpaque(false);

        JButton addSkinBtn = new JButton("Add PNG");
        JButton setActiveSkinBtn = new JButton("Set Active");
        JButton removeSkinBtn = new JButton("Remove");

        for (JButton b : new JButton[]{addSkinBtn, setActiveSkinBtn, removeSkinBtn}) {
            b.setFocusPainted(false);
            b.setFont(new Font("SansSerif", Font.PLAIN, 11));
        }

        addSkinBtn.addActionListener(e -> {
            safeRun(this::addSkin);
            saveSkins();
        });

        setActiveSkinBtn.addActionListener(e -> {
            safeRun(this::setActiveSkin);
            saveSettings();
        });

        removeSkinBtn.addActionListener(e -> {
            safeRun(this::removeSkin);
            saveSkins();
            saveSettings();
        });

        leftButtons.add(addSkinBtn);
        leftButtons.add(setActiveSkinBtn);
        leftButtons.add(removeSkinBtn);

        left.add(leftButtons, BorderLayout.SOUTH);

        card.add(left, BorderLayout.WEST);

        JPanel right = new JPanel(new BorderLayout());
        right.setOpaque(false);
        right.setBorder(new EmptyBorder(0, 16, 0, 0));

        skinPreviewLabel = new JLabel("Skin Preview", SwingConstants.CENTER);
        skinPreviewLabel.setForeground(TEXT_SECONDARY);
        skinPreviewLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));
        skinPreviewLabel.setPreferredSize(new Dimension(220, 220));
        skinPreviewLabel.setBorder(BorderFactory.createLineBorder(new Color(60, 60, 60)));

        right.add(skinPreviewLabel, BorderLayout.CENTER);

        JLabel hint = new JLabel("Active skin will be applied when launching.");
        hint.setForeground(TEXT_SECONDARY);
        hint.setFont(new Font("SansSerif", Font.PLAIN, 11));

        right.add(hint, BorderLayout.SOUTH);

        card.add(right, BorderLayout.CENTER);

        panel.add(card, BorderLayout.CENTER);

        return panel;
    }

    private void addSkin() {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Select Skin PNG");

        int res = chooser.showOpenDialog(this);

        if (res == JFileChooser.APPROVE_OPTION) {
            File f = chooser.getSelectedFile();
            skinModel.addElement(new SkinEntry(f.getName(), f.getAbsolutePath()));
        }
    }

    private void setActiveSkin() {
        SkinEntry entry = skinList.getSelectedValue();
        if (entry == null) return;

        activeSkin = entry;
        setStatus("Active skin set to: " + entry.name);
        updateSkinPreview();
    }

    private void removeSkin() {
        SkinEntry entry = skinList.getSelectedValue();
        if (entry == null) return;

        if (entry.path == null) {
            JOptionPane.showMessageDialog(
                    this,
                    "Cannot remove default skin.",
                    "Skins",
                    JOptionPane.INFORMATION_MESSAGE
            );
            return;
        }

        skinModel.removeElement(entry);

        if (entry == activeSkin) {
            activeSkin = null;
            skinPreviewLabel.setIcon(null);
            skinPreviewLabel.setText("Skin Preview");
        }
    }

    private void updateSkinPreview() {
        if (activeSkin == null || activeSkin.path == null) {
            skinPreviewLabel.setIcon(null);
            skinPreviewLabel.setText("Skin Preview (default purple block)");
            return;
        }

        try {
            BufferedImage img = ImageIO.read(new File(activeSkin.path));

            if (img != null) {
                Image scaled = img.getScaledInstance(220, 220, Image.SCALE_SMOOTH);
                skinPreviewLabel.setIcon(new ImageIcon(scaled));
                skinPreviewLabel.setText("");
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load skin preview: " + activeSkin.path, e);
        }
    }

    // --- Patch Notes Panel ---
    private JPanel createPatchNotesPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel(new BorderLayout());
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(16, 16, 16, 16));

        JLabel title = new JLabel("PATCH NOTES");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 14));

        JPanel topWrapper = new JPanel(new BorderLayout());
        topWrapper.setOpaque(false);
        topWrapper.add(title, BorderLayout.NORTH);

        JPanel top = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 8));
        top.setOpaque(false);

        JLabel versionLabel = new JLabel("Version:");
        versionLabel.setForeground(TEXT_SECONDARY);
        top.add(versionLabel);

        patchVersionBox = new JComboBox<>(new String[]{
                "IRL Simulator 1.1.0 - The Grox Update",
                "IRL Simulator 1.0.1 - Hotfix",
                "IRL Simulator 1.0.0 - Initial Release"
        });

        patchVersionBox.setSelectedItem(lastPatchNotesVersion);

        patchVersionBox.addActionListener(e -> {
            lastPatchNotesVersion = (String) patchVersionBox.getSelectedItem();
            updatePatchNotesText();
            saveSettings();
        });

        top.add(patchVersionBox);

        topWrapper.add(top, BorderLayout.CENTER);

        card.add(topWrapper, BorderLayout.NORTH);

        patchNotesArea = new JTextArea();
        patchNotesArea.setEditable(false);
        patchNotesArea.setLineWrap(true);
        patchNotesArea.setWrapStyleWord(true);
        patchNotesArea.setForeground(TEXT_SECONDARY);
        patchNotesArea.setBackground(new Color(20, 20, 20));
        patchNotesArea.setFont(new Font("SansSerif", Font.PLAIN, 12));

        updatePatchNotesText();

        card.add(new JScrollPane(patchNotesArea), BorderLayout.CENTER);

        panel.add(card, BorderLayout.CENTER);

        return panel;
    }

    private void updatePatchNotesText() {
        String v = lastPatchNotesVersion;
        String text;

        if (v == null) v = "";

        if (v.startsWith("IRL Simulator 1.1.0")) {
            text = """
                   THE GROX UPDATE

                   - New Grox-themed launcher UI
                   - PLAY tab with installation dropdown
                   - Auto-download and management of IRL Simulator files
                   - Expansion pack scanner
                   - Worlds row from configs/
                   - News panel from news.json
                   - Grox Revenge default skin
                   - Improved multiplayer presets
                   """;
        } else if (v.startsWith("IRL Simulator 1.0.1")) {
            text = """
                   HOTFIX 1.0.1

                   - Fixed minor UI glitches
                   - Improved error handling and logging
                   - Small performance tweaks
                   """;
        } else {
            text = """
                   INITIAL RELEASE 1.0.0

                   - First public build of IRL Simulator
                   - Basic launcher and single-player runtime
                   """;
        }

        patchNotesArea.setText(text);
        patchNotesArea.setCaretPosition(0);
    }

    // --- Settings Panel ---
    private JPanel createSettingsPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel();
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(20, 20, 20, 20));
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));

        JLabel title = new JLabel("SETTINGS");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 16));

        card.add(title);
        card.add(Box.createVerticalStrut(12));

        JPanel langPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        langPanel.setOpaque(false);

        JLabel langLabel = new JLabel("Language:");
        langLabel.setForeground(TEXT_PRIMARY);

        JComboBox<String> langBox = new JComboBox<>(new String[]{"en-US", "en-GB", "de-DE", "fr-FR"});
        langBox.setSelectedItem(languageCode);

        langBox.addActionListener(e -> {
            languageCode = (String) langBox.getSelectedItem();
            saveSettings();
        });

        langPanel.add(langLabel);
        langPanel.add(langBox);

        card.add(langPanel);
        card.add(Box.createVerticalStrut(8));

        JPanel msPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        msPanel.setOpaque(false);

        JLabel msLabel = new JLabel("Microsoft account: " + (isSignedInWithMicrosoft ? currentUsername : "Not signed in"));
        msLabel.setForeground(TEXT_SECONDARY);

        JButton msButton = new JButton("Change / Sign in");
        msButton.setFont(new Font("SansSerif", Font.PLAIN, 11));

        msButton.addActionListener(e -> {
            simulateMicrosoftSignIn();
            msLabel.setText("Microsoft account: " + (isSignedInWithMicrosoft ? currentUsername : "Not signed in"));
            saveProfile();
        });

        msPanel.add(msLabel);
        msPanel.add(msButton);

        card.add(msPanel);
        card.add(Box.createVerticalStrut(8));

        JCheckBox logCheck = new JCheckBox("Show game log in new window on launch", showLogWindowOnLaunch);
        logCheck.setOpaque(false);
        logCheck.setForeground(TEXT_PRIMARY);
        logCheck.setFont(new Font("SansSerif", Font.PLAIN, 12));

        logCheck.addActionListener(e -> {
            showLogWindowOnLaunch = logCheck.isSelected();
            saveSettings();
        });

        card.add(logCheck);
        card.add(Box.createVerticalStrut(12));

        JTextArea info = new JTextArea(
                "When enabled, pressing PLAY will open a separate log window.\n" +
                "The log window shows everything the game prints, with filters for:\n" +
                "  • INFO\n" +
                "  • WARN\n" +
                "  • ERROR\n" +
                "  • DEBUG\n\n" +
                "Any uncaught game error triggers the global error popup with full stack trace.\n" +
                "The launcher stays open."
        );

        info.setEditable(false);
        info.setOpaque(false);
        info.setForeground(TEXT_SECONDARY);
        info.setFont(new Font("SansSerif", Font.PLAIN, 11));
        info.setLineWrap(true);
        info.setWrapStyleWord(true);

        card.add(info);

        panel.add(card, BorderLayout.CENTER);

        return panel;
    }

    // --- About Panel ---
    private JPanel createAboutPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);

        JPanel card = new JPanel();
        card.setBackground(BG_CARD);
        card.setBorder(new EmptyBorder(20, 20, 20, 20));
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));

        JLabel title = new JLabel("ABOUT IRL SIMULATOR LAUNCHER");
        title.setForeground(TEXT_PRIMARY);
        title.setFont(new Font("SansSerif", Font.BOLD, 16));

        JLabel build = new JLabel(BUILD_ID);
        build.setForeground(TEXT_SECONDARY);
        build.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JTextArea body = new JTextArea(
                "Grox official launcher for IRL Simulator.\n\n" +
                "• PLAY tab launches selected installations\n" +
                "• Expansion packs scan from expansion_packs/\n" +
                "• Worlds scan from configs/\n" +
                "• News loads from alaricholt677.github.io/news/news.json\n" +
                "• Manages installations and skins\n" +
                "• Handles auto-downloads and updates\n" +
                "• Runs the game in the same JVM so uncaught errors are captured\n\n" +
                "The launcher itself never auto-closes on errors; only the game thread dies."
        );

        body.setEditable(false);
        body.setOpaque(false);
        body.setForeground(TEXT_SECONDARY);
        body.setFont(new Font("SansSerif", Font.PLAIN, 12));
        body.setLineWrap(true);
        body.setWrapStyleWord(true);

        card.add(title);
        card.add(Box.createVerticalStrut(4));
        card.add(build);
        card.add(Box.createVerticalStrut(12));
        card.add(body);

        panel.add(card, BorderLayout.CENTER);

        return panel;
    }

    // --- Launch logic ---
    private void startLaunchThread() {
        Thread t = new Thread(() -> {
            try {
                runGameExecutor();
            } catch (Throwable ex) {
                handleGlobalException(ex);
            }
        }, "IRL-Launch-Thread");

        t.start();
    }

    private void runGameExecutor() throws Exception {
        SwingUtilities.invokeLater(() -> {
            progressBar.setVisible(true);
            progressBar.setValue(0);
            setStatus("Preparing launch...");
        });

        if (activeInstallation == null) {
            throw new IllegalStateException("No active installation selected.");
        }

        Path workDir = Paths.get(".").toAbsolutePath().normalize();
        Path jarPath = workDir.resolve(activeInstallation.path);

        if (!Files.exists(jarPath)) {
            setStatus("Downloading IRL Simulator...");
            downloadAndExtractZip(DOWNLOAD_URL, workDir);
        }

        if (!Files.exists(jarPath)) {
            throw new FileNotFoundException(activeInstallation.path + " not found after download.");
        }

        SwingUtilities.invokeLater(() -> {
            progressBar.setValue(40);
            setStatus("Building launch arguments...");
        });

        String pathToClasses = workDir.toString();
        String name = currentUsername;

        String skinDir;

        if (activeSkin != null && activeSkin.path != null) {
            File skinFile = new File(activeSkin.path);
            File parent = skinFile.getParentFile();

            if (parent == null || !parent.exists() || !parent.isDirectory()) {
                File fallback = new File("skins/selected");
                fallback.mkdirs();
                skinDir = fallback.getAbsolutePath();
            } else {
                skinDir = parent.getAbsolutePath();
            }
        } else {
            File def = new File("skins/default");
            def.mkdirs();
            skinDir = def.getAbsolutePath();
        }

        File sdCheck = new File(skinDir);

        if (!sdCheck.exists() || !sdCheck.isDirectory()) {
            throw new RuntimeException("BOOT FAILURE: Skin Directory not found: " + skinDir);
        }

        String version = activeInstallation.version == null || activeInstallation.version.isBlank()
                ? "1.1.0"
                : activeInstallation.version;

String[] args = new String[]{
        "--PathToClasses", pathToClasses,
        "--Name", name,
        "--skinDir", skinDir,
        "--version", version
};

        SwingUtilities.invokeLater(() -> {
            progressBar.setValue(70);
            setStatus("Launching " + activeInstallation.name + "...");
        });

        if (showLogWindowOnLaunch) {
            SwingUtilities.invokeAndWait(() -> {
                currentLogWindow = new LogWindow();
                currentLogWindow.setVisible(true);
            });
        } else {
            currentLogWindow = null;
        }

        SwingUtilities.invokeAndWait(() -> {
            PrintStream newOut = new PrintStream(new LogOutputStream(originalOut, currentLogWindow, false), true);
            PrintStream newErr = new PrintStream(new LogOutputStream(originalErr, currentLogWindow, true), true);

            System.setOut(newOut);
            System.setErr(newErr);
        });

        URLClassLoader cl = new URLClassLoader(
                new URL[]{jarPath.toUri().toURL()},
                Launcher.class.getClassLoader()
        );

        Thread gameThread = new Thread(() -> {
            try {
                Class<?> mainClass = cl.loadClass("main.Main");
                Method m = mainClass.getMethod("main", String[].class);
                m.invoke(null, (Object) args);
            } catch (InvocationTargetException ite) {
                Throwable cause = ite.getCause() != null ? ite.getCause() : ite;
                handleGlobalException(cause);
            } catch (Throwable t) {
                handleGlobalException(t);
            } finally {
                try {
                    cl.close();
                } catch (IOException ignored) {
                }

                System.setOut(originalOut);
                System.setErr(originalErr);

                SwingUtilities.invokeLater(() -> setStatus("Game stopped. You can launch again."));
            }
        }, "IRL-Game-Main");

        gameThread.setUncaughtExceptionHandler(Thread.getDefaultUncaughtExceptionHandler());
        gameThread.start();

        SwingUtilities.invokeLater(() -> {
            progressBar.setValue(100);
            setStatus("IRL Simulator running.");
        });
    }

    private void downloadAndExtractZip(String url, Path targetDir) throws IOException {
        Path tempZip = Files.createTempFile("irl_download", ".zip");

        try (InputStream in = new URL(url).openStream()) {
            Files.copy(in, tempZip, StandardCopyOption.REPLACE_EXISTING);
        }

        try (ZipInputStream zis = new ZipInputStream(Files.newInputStream(tempZip))) {
            ZipEntry entry;

            while ((entry = zis.getNextEntry()) != null) {
                Path outPath = targetDir.resolve(entry.getName()).normalize();

                if (!outPath.startsWith(targetDir)) {
                    throw new IOException("Zip entry outside target dir: " + entry.getName());
                }

                if (entry.isDirectory()) {
                    Files.createDirectories(outPath);
                } else {
                    Files.createDirectories(outPath.getParent());
                    Files.copy(zis, outPath, StandardCopyOption.REPLACE_EXISTING);
                }

                zis.closeEntry();
            }
        } finally {
            try {
                Files.deleteIfExists(tempZip);
            } catch (IOException ignored) {
            }
        }
    }

    private void setStatus(String text) {
        SwingUtilities.invokeLater(() -> statusLabel.setText(text));
    }

    // --- Persistence ---
    private void loadProfile() {
        File f = new File(DATA_DIR, PROFILE_FILE);

        if (!f.exists()) return;

        Properties p = new Properties();

        try (FileInputStream in = new FileInputStream(f)) {
            p.load(in);

            currentUsername = p.getProperty("username", currentUsername);
            isSignedInWithMicrosoft = Boolean.parseBoolean(p.getProperty("msSignedIn", "false"));
        } catch (IOException ignored) {
        }
    }

    private void saveProfile() {
        Properties p = new Properties();

        p.setProperty("username", currentUsername);
        p.setProperty("msSignedIn", Boolean.toString(isSignedInWithMicrosoft));

        File f = new File(DATA_DIR, PROFILE_FILE);

        try (FileOutputStream out = new FileOutputStream(f)) {
            p.store(out, "IRL Launcher Profile");
        } catch (IOException ignored) {
        }
    }

    private void loadSettings() {
        File f = new File(DATA_DIR, SETTINGS_FILE);

        if (!f.exists()) return;

        Properties p = new Properties();

        try (FileInputStream in = new FileInputStream(f)) {
            p.load(in);

            int w = Integer.parseInt(p.getProperty("width", "1150"));
            int h = Integer.parseInt(p.getProperty("height", "700"));

            setSize(w, h);

            lastTabKey = p.getProperty("lastTabKey", "play");
            lastPatchNotesVersion = p.getProperty("lastPatchNotesVersion", lastPatchNotesVersion);
            showLogWindowOnLaunch = Boolean.parseBoolean(p.getProperty("showLogWindowOnLaunch", "true"));
            languageCode = p.getProperty("languageCode", "en-US");
        } catch (Exception ignored) {
        }
    }

    private void saveSettings() {
        Properties p = new Properties();

        p.setProperty("width", Integer.toString(getWidth()));
        p.setProperty("height", Integer.toString(getHeight()));
        p.setProperty("lastTabKey", lastTabKey);
        p.setProperty("lastPatchNotesVersion", lastPatchNotesVersion == null ? "" : lastPatchNotesVersion);
        p.setProperty("showLogWindowOnLaunch", Boolean.toString(showLogWindowOnLaunch));
        p.setProperty("languageCode", languageCode);

        if (activeInstallation != null) {
            p.setProperty("activeInstallationName", activeInstallation.name);
        }

        if (activeSkin != null) {
            p.setProperty("activeSkinName", activeSkin.name);
        }

        File f = new File(DATA_DIR, SETTINGS_FILE);

        try (FileOutputStream out = new FileOutputStream(f)) {
            p.store(out, "IRL Launcher Settings");
        } catch (IOException ignored) {
        }
    }

    private void loadInstallations() {
        File f = new File(DATA_DIR, INSTALLATIONS_FILE);

        if (!f.exists()) {
            installationModel.addElement(new Installation("IRL Simulator - Default", "1.1.0", JAR_NAME));
            return;
        }

        installationModel.clear();

        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;

            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\\|", 3);

                if (parts.length == 3) {
                    installationModel.addElement(new Installation(parts[0], parts[1], parts[2]));
                }
            }
        } catch (IOException ignored) {
        }

        if (installationModel.isEmpty()) {
            installationModel.addElement(new Installation("IRL Simulator - Default", "1.1.0", JAR_NAME));
        }
    }

    private void saveInstallations() {
        File f = new File(DATA_DIR, INSTALLATIONS_FILE);

        try (PrintWriter pw = new PrintWriter(new FileWriter(f))) {
            for (int i = 0; i < installationModel.size(); i++) {
                Installation inst = installationModel.get(i);
                pw.println(inst.name + "|" + inst.version + "|" + inst.path);
            }
        } catch (IOException ignored) {
        }
    }

    private void loadSkins() {
        File f = new File(DATA_DIR, SKINS_FILE);

        if (!f.exists()) {
            skinModel.addElement(new SkinEntry("Revenge Purple Block (default)", null));
            return;
        }

        skinModel.clear();

        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;

            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\\|", 2);

                String name = parts[0];
                String path = parts.length > 1 && !parts[1].isEmpty() ? parts[1] : null;

                skinModel.addElement(new SkinEntry(name, path));
            }
        } catch (IOException ignored) {
        }

        if (skinModel.isEmpty()) {
            skinModel.addElement(new SkinEntry("Revenge Purple Block (default)", null));
        }
    }

    private void saveSkins() {
        File f = new File(DATA_DIR, SKINS_FILE);

        try (PrintWriter pw = new PrintWriter(new FileWriter(f))) {
            for (int i = 0; i < skinModel.size(); i++) {
                SkinEntry s = skinModel.get(i);
                pw.println(s.name + "|" + (s.path == null ? "" : s.path));
            }
        } catch (IOException ignored) {
        }
    }

    private void safeRun(Runnable r) {
        try {
            r.run();
        } catch (Throwable t) {
            handleGlobalException(t);
        }
    }

    private void handleGlobalException(Throwable t) {
        Thread.UncaughtExceptionHandler h = Thread.getDefaultUncaughtExceptionHandler();

        if (h != null) {
            h.uncaughtException(Thread.currentThread(), t);
        } else {
            t.printStackTrace();
        }
    }

    // --- Data classes ---
    private static class Installation {
        String name;
        String version;
        String path;

        Installation(String name, String version, String path) {
            this.name = name;
            this.version = version;
            this.path = path;
        }

        @Override
        public String toString() {
            return name + "  (" + version + ")";
        }
    }

    private static class SkinEntry {
        String name;
        String path;

        SkinEntry(String name, String path) {
            this.name = name;
            this.path = path;
        }

        @Override
        public String toString() {
            return name + (path != null ? "  [" + path + "]" : "");
        }
    }

    private static class ExpansionPack {
        String name;
        String path;
        long sizeBytes;

        ExpansionPack(String name, String path, long sizeBytes) {
            this.name = name;
            this.path = path;
            this.sizeBytes = sizeBytes;
        }

        @Override
        public String toString() {
            return name + "  (" + readableSize(sizeBytes) + ")";
        }

        private static String readableSize(long size) {
            if (size < 1024) return size + " B";
            if (size < 1024 * 1024) return String.format("%.1f KB", size / 1024.0);
            return String.format("%.1f MB", size / (1024.0 * 1024.0));
        }
    }

    private static class NewsArticle {
        String id;
        String name;
        String imageURL;
        String content;
        String date;

        NewsArticle(String id, String name, String imageURL, String content, String date) {
            this.id = id;
            this.name = name;
            this.imageURL = imageURL;
            this.content = content;
            this.date = date;
        }
    }

    private static class DottedBackgroundPanel extends JPanel {
        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);

            Graphics2D g2 = (Graphics2D) g.create();

            g2.setColor(new Color(18, 18, 18));
            g2.fillRect(0, 0, getWidth(), getHeight());

            g2.setColor(new Color(40, 40, 40));

            for (int y = 0; y < getHeight(); y += 12) {
                for (int x = 0; x < getWidth(); x += 12) {
                    g2.fill(new RoundRectangle2D.Float(x, y, 2, 2, 2, 2));
                }
            }

            g2.dispose();
        }
    }

    // --- Log window ---
    private static class LogWindow extends JFrame {
        private final JTextArea logArea;
        private final JCheckBox infoBox;
        private final JCheckBox warnBox;
        private final JCheckBox errorBox;
        private final JCheckBox debugBox;

        private final List<LogLine> allLines = new ArrayList<>();

        LogWindow() {
            setTitle("IRL Simulator Log");
            setSize(800, 500);
            setLocationRelativeTo(null);
            setLayout(new BorderLayout());

            logArea = new JTextArea();
            logArea.setEditable(false);
            logArea.setFont(new Font("Consolas", Font.PLAIN, 11));

            JScrollPane scroll = new JScrollPane(logArea);
            add(scroll, BorderLayout.CENTER);

            JPanel bottom = new JPanel(new BorderLayout());
            JPanel filters = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 2));

            infoBox = new JCheckBox("INFO", true);
            warnBox = new JCheckBox("WARN", true);
            errorBox = new JCheckBox("ERROR", true);
            debugBox = new JCheckBox("DEBUG", true);

            for (JCheckBox cb : new JCheckBox[]{infoBox, warnBox, errorBox, debugBox}) {
                cb.setFont(new Font("SansSerif", Font.PLAIN, 11));
                cb.addActionListener(e -> refreshView());
                filters.add(cb);
            }

            bottom.add(filters, BorderLayout.WEST);

            JButton copyBtn = new JButton("Copy log");
            copyBtn.setFont(new Font("SansSerif", Font.PLAIN, 11));

            copyBtn.addActionListener(e -> {
                String text = logArea.getText();

                Toolkit.getDefaultToolkit()
                        .getSystemClipboard()
                        .setContents(new java.awt.datatransfer.StringSelection(text), null);
            });

            bottom.add(copyBtn, BorderLayout.EAST);

            add(bottom, BorderLayout.SOUTH);
        }

        synchronized void appendLine(String line) {
            LogLevel level = classify(line);

            allLines.add(new LogLine(level, line));

            if (isVisibleFor(level)) {
                logArea.append(line + "\n");
                logArea.setCaretPosition(logArea.getDocument().getLength());
            }
        }

        private LogLevel classify(String line) {
            String l = line.toLowerCase();

            if (l.contains("error") || l.contains("exception") || l.contains("fail")) return LogLevel.ERROR;
            if (l.contains("warn")) return LogLevel.WARN;
            if (l.contains("debug")) return LogLevel.DEBUG;

            return LogLevel.INFO;
        }

        private boolean isVisibleFor(LogLevel level) {
            return switch (level) {
                case INFO -> infoBox.isSelected();
                case WARN -> warnBox.isSelected();
                case ERROR -> errorBox.isSelected();
                case DEBUG -> debugBox.isSelected();
            };
        }

        private synchronized void refreshView() {
            StringBuilder sb = new StringBuilder();

            for (LogLine ln : allLines) {
                if (isVisibleFor(ln.level)) {
                    sb.append(ln.text).append("\n");
                }
            }

            logArea.setText(sb.toString());
            logArea.setCaretPosition(logArea.getDocument().getLength());
        }

        private enum LogLevel {
            INFO,
            WARN,
            ERROR,
            DEBUG
        }

        private static class LogLine {
            final LogLevel level;
            final String text;

            LogLine(LogLevel level, String text) {
                this.level = level;
                this.text = text;
            }
        }
    }

    private static class LogOutputStream extends OutputStream {
        private final PrintStream console;
        private final LogWindow logWindow;
        private final boolean isError;
        private final StringBuilder buffer = new StringBuilder();

        LogOutputStream(PrintStream console, LogWindow logWindow, boolean isError) {
            this.console = console;
            this.logWindow = logWindow;
            this.isError = isError;
        }

        @Override
        public void write(int b) {
            char c = (char) b;

            console.print(c);

            if (c == '\n') {
                flushBuffer();
            } else {
                buffer.append(c);
            }
        }

        @Override
        public void flush() {
            console.flush();
            flushBuffer();
        }

        private void flushBuffer() {
            if (buffer.length() == 0) return;

            String line = buffer.toString();
            buffer.setLength(0);

            if (logWindow != null) {
                SwingUtilities.invokeLater(() -> logWindow.appendLine((isError ? "[ERR] " : "[OUT] ") + line));
            }
        }
    }

    // --- Global error handler ---
    public static final class GlobalErrorHandler implements Thread.UncaughtExceptionHandler {
        @Override
        public void uncaughtException(Thread t, Throwable e) {
            if (isIgnorable(e)) {
                e.printStackTrace();
                return;
            }

            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));

            String stackText = sw.toString();

            SwingUtilities.invokeLater(() -> showErrorDialog(stackText));

            System.err.println(stackText);
        }

        private static boolean isIgnorable(Throwable e) {
            String msg = (e.getMessage() == null ? "" : e.getMessage()).toLowerCase();

            return msg.contains("not found")
                    || msg.contains("missing ui")
                    || msg.contains("icon resource")
                    || msg.contains("could not find file")
                    || msg.contains("no such file or directory");
        }

        private static void showErrorDialog(String stackText) {
            JTextArea area = new JTextArea(stackText, 20, 80);
            area.setEditable(false);
            area.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 11));

            JScrollPane scroll = new JScrollPane(area);

            JButton copyBtn = new JButton("Copy error to clipboard");

            copyBtn.addActionListener(ev -> {
                Toolkit.getDefaultToolkit()
                        .getSystemClipboard()
                        .setContents(new java.awt.datatransfer.StringSelection(stackText), null);
            });

            JPanel panel = new JPanel(new BorderLayout(8, 8));
            panel.add(new JLabel("An unrecoverable error occurred in IRL Simulator."), BorderLayout.NORTH);
            panel.add(scroll, BorderLayout.CENTER);
            panel.add(copyBtn, BorderLayout.SOUTH);

            JOptionPane.showMessageDialog(
                    null,
                    panel,
                    "ERROR IN IRL SIMULATOR",
                    JOptionPane.ERROR_MESSAGE
            );
        }
    }
}
