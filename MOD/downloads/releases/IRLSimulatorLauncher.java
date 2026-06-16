import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import javax.imageio.ImageIO;

public class Launcher extends JFrame {

    // --- Config ---
    private static final String DOWNLOAD_URL = "https://alaricholt677.github.io/downloads/irl.zip";
    private static final String JAR_NAME = "IRLSimulator.jar";
    private static final String BUILD_ID = "IRL-Launcher Build r11";

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

    private DefaultListModel<SkinEntry> skinModel = new DefaultListModel<>();
    private SkinEntry activeSkin;
    private JList<SkinEntry> skinList;
    private JLabel skinPreviewLabel;

    private String lastTabKey = "home";
    private String lastPatchNotesVersion = "IRL Simulator 1.1.0 - The Grox Update";

    private JProgressBar progressBar;
    private JLabel statusLabel;
    private JLabel profileNameLabel;
    private JLabel profileTagLabel;

    private CardLayout centerCards;
    private JPanel centerCardContainer;

    private JButton homeSideButton;
    private JButton instSideButton;
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
                Launcher l = new Launcher();
                l.setVisible(true);
            } catch (Throwable t) {
                Thread.UncaughtExceptionHandler h = Thread.getDefaultUncaughtExceptionHandler();
                if (h != null) h.uncaughtException(Thread.currentThread(), t);
                else t.printStackTrace();
            }
        });
    }

    public Launcher() {
        initDataDir();
        loadProfile();
        loadSettings();
        loadInstallations();
        loadSkins();
        setupUI();
        applyLoadedState();
        addComponentListener(new ComponentAdapter() {
            @Override public void componentResized(ComponentEvent e) {
                saveSettings();
            }
        });

        originalOut = System.out;
        originalErr = System.err;
    }

    private void initDataDir() {
        File dir = new File(DATA_DIR);
        if (!dir.exists()) dir.mkdirs();
    }

    // --- UI setup ---
    private void setupUI() {
        setTitle("IRL Simulator Launcher");
        setSize(1150, 700);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());
        getContentPane().setBackground(BG_DARK);

        JPanel sidebar = new JPanel();
        sidebar.setPreferredSize(new Dimension(230, 700));
        sidebar.setBackground(BG_DARK);
        sidebar.setLayout(new BorderLayout());

        JPanel logoPanel = new JPanel() {
            @Override protected void paintComponent(Graphics g) {
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

        homeSideButton = createSidebarButton("HOME", true);
        instSideButton = createSidebarButton("INSTALLATIONS", false);
        skinsSideButton = createSidebarButton("SKINS", false);
        patchSideButton = createSidebarButton("PATCH NOTES", false);
        settingsSideButton = createSidebarButton("SETTINGS", false);
        aboutSideButton = createSidebarButton("ABOUT", false);

        sideButtons.add(homeSideButton);
        sideButtons.add(Box.createVerticalStrut(8));
        sideButtons.add(instSideButton);
        sideButtons.add(Box.createVerticalStrut(8));
        sideButtons.add(skinsSideButton);
        sideButtons.add(Box.createVerticalStrut(8));
        sideButtons.add(patchSideButton);
        sideButtons.add(Box.createVerticalStrut(8));
        sideButtons.add(settingsSideButton);
        sideButtons.add(Box.createVerticalStrut(8));
        sideButtons.add(aboutSideButton);

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

        add(sidebar, BorderLayout.WEST);

        JPanel mainArea = new DottedBackgroundPanel();
        mainArea.setLayout(new BorderLayout());
        mainArea.setBorder(new EmptyBorder(10, 10, 10, 10));
        add(mainArea, BorderLayout.CENTER);

        JPanel header = new JPanel() {
            @Override protected void paintComponent(Graphics g) {
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

        mainArea.add(header, BorderLayout.NORTH);

        centerCards = new CardLayout();
        centerCardContainer = new JPanel(centerCards);
        centerCardContainer.setOpaque(false);
        centerCardContainer.setBorder(new EmptyBorder(10, 10, 10, 10));

        centerCardContainer.add(createHomePanel(), "home");
        centerCardContainer.add(createInstallationsPanel(), "inst");
        centerCardContainer.add(createSkinsPanel(), "skins");
        centerCardContainer.add(createPatchNotesPanel(), "patch");
        centerCardContainer.add(createSettingsPanel(), "settings");
        centerCardContainer.add(createAboutPanel(), "about");

        mainArea.add(centerCardContainer, BorderLayout.CENTER);

        JPanel bottomBar = new JPanel(new BorderLayout());
        bottomBar.setBackground(BG_MAIN);
        bottomBar.setBorder(new EmptyBorder(8, 20, 8, 20));
        bottomBar.setPreferredSize(new Dimension(100, 80));

        JPanel userPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 0));
        userPanel.setOpaque(false);

        JPanel avatar = new JPanel() {
            @Override protected void paintComponent(Graphics g) {
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

        JPanel centerBottom = new JPanel(new BorderLayout());
        centerBottom.setOpaque(false);

        progressBar = new JProgressBar(0, 100);
        progressBar.setVisible(false);
        progressBar.setStringPainted(true);
        progressBar.setForeground(ACCENT);
        progressBar.setBackground(new Color(40, 40, 40));

        centerBottom.add(progressBar, BorderLayout.CENTER);

        bottomBar.add(centerBottom, BorderLayout.CENTER);

        JButton playButton = new JButton("  PLAY  ") {
            @Override protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                Color base = getModel().isRollover() ? ACCENT_ALT : ACCENT;
                g2.setColor(base);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 30, 30);

                g2.setColor(new Color(0, 0, 0, 60));
                g2.drawRoundRect(1, 1, getWidth() - 3, getHeight() - 3, 28, 28);

                int cx = 18;
                int cy = getHeight() / 2;
                Polygon tri = new Polygon();
                tri.addPoint(cx - 4, cy - 7);
                tri.addPoint(cx - 4, cy + 7);
                tri.addPoint(cx + 6, cy);
                g2.setColor(Color.WHITE);
                g2.fillPolygon(tri);

                g2.dispose();
                super.paintComponent(g);
            }
        };
        playButton.setFont(new Font("SansSerif", Font.BOLD, 16));
        playButton.setForeground(Color.WHITE);
        playButton.setContentAreaFilled(false);
        playButton.setFocusPainted(false);
        playButton.setBorderPainted(false);
        playButton.setPreferredSize(new Dimension(150, 40));
        playButton.setHorizontalAlignment(SwingConstants.CENTER);
        playButton.addActionListener(e -> startLaunchThread());

        bottomBar.add(playButton, BorderLayout.EAST);

        mainArea.add(bottomBar, BorderLayout.SOUTH);

        homeSideButton.addActionListener(e -> switchSection("home", homeSideButton));
        instSideButton.addActionListener(e -> switchSection("inst", instSideButton));
        skinsSideButton.addActionListener(e -> switchSection("skins", skinsSideButton));
        patchSideButton.addActionListener(e -> switchSection("patch", patchSideButton));
        settingsSideButton.addActionListener(e -> switchSection("settings", settingsSideButton));
        aboutSideButton.addActionListener(e -> switchSection("about", aboutSideButton));
    }

    private void applyLoadedState() {
        if (activeInstallation == null && installationModel.getSize() > 0) {
            activeInstallation = installationModel.getElementAt(0);
        }
        if (installationList != null && activeInstallation != null) {
            installationList.setSelectedValue(activeInstallation, true);
        }

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

        JButton target = homeSideButton;
        if ("inst".equals(lastTabKey)) target = instSideButton;
        else if ("skins".equals(lastTabKey)) target = skinsSideButton;
        else if ("patch".equals(lastTabKey)) target = patchSideButton;
        else if ("settings".equals(lastTabKey)) target = settingsSideButton;
        else if ("about".equals(lastTabKey)) target = aboutSideButton;
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

        JButton[] all = {homeSideButton, instSideButton, skinsSideButton, patchSideButton, settingsSideButton, aboutSideButton};
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

        JLabel subtitle = new JLabel("New official launcher handles all files for you.");
        subtitle.setForeground(TEXT_SECONDARY);
        subtitle.setFont(new Font("SansSerif", Font.PLAIN, 13));

        JTextArea body = new JTextArea(
            "• Auto-downloads IRL Simulator files\n" +
            "• Injects Grox profile and Revenge skin\n" +
            "• Multiplayer presets ready to copy\n\n" +
            "Active installation and skin are used when you press PLAY at the bottom."
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
            installationModel.addElement(new Installation("IRL Simulator - Default", "1.0.0", JAR_NAME));
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

        addBtn.addActionListener(e -> { safeRun(this::addInstallation); saveInstallations(); });
        editBtn.addActionListener(e -> { safeRun(this::editInstallation); saveInstallations(); });
        delBtn.addActionListener(e -> { safeRun(this::deleteInstallation); saveInstallations(); });
        setActiveBtn.addActionListener(e -> { safeRun(this::setActiveInstallation); saveSettings(); });

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
        msSignInButton.addActionListener(e -> { safeRun(this::simulateMicrosoftSignIn); saveProfile(); });

        msPanel.add(msSignInButton);

        bottom.add(buttons, BorderLayout.WEST);
        bottom.add(msPanel, BorderLayout.EAST);

        card.add(bottom, BorderLayout.SOUTH);

        panel.add(card, BorderLayout.CENTER);
        return panel;
    }

    private void addInstallation() {
        JTextField nameField = new JTextField("New Installation");
        JTextField versionField = new JTextField("1.0.0");
        JTextField pathField = new JTextField(JAR_NAME);

        JPanel p = new JPanel(new GridLayout(0, 1, 4, 4));
        p.add(new JLabel("Name:"));
        p.add(nameField);
        p.add(new JLabel("Version:"));
        p.add(versionField);
        p.add(new JLabel("Jar Path:"));
        p.add(pathField);

        int res = JOptionPane.showConfirmDialog(this, p, "Create Installation",
                                                JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        if (res == JOptionPane.OK_OPTION) {
            Installation inst = new Installation(nameField.getText().trim(),
                                                 versionField.getText().trim(),
                                                 pathField.getText().trim());
            installationModel.addElement(inst);
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

        int res = JOptionPane.showConfirmDialog(this, p, "Edit Installation",
                                                JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
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
        int res = JOptionPane.showConfirmDialog(this,
                "Delete installation \"" + inst.name + "\"?",
                "Delete Installation", JOptionPane.YES_NO_OPTION);
        if (res == JOptionPane.YES_OPTION) {
            installationModel.removeElement(inst);
            if (inst == activeInstallation) {
                activeInstallation = null;
                setStatus("Active installation removed. Set a new one.");
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
        String name = JOptionPane.showInputDialog(this,
                "Enter Microsoft profile name:", currentUsername);
        if (name != null && !name.trim().isEmpty()) {
            currentUsername = name.trim();
            isSignedInWithMicrosoft = true;
            profileNameLabel.setText(currentUsername);
            profileTagLabel.setText("PROFILE: " + currentUsername.toUpperCase());
            setStatus("Signed in as " + currentUsername + " (simulated)");
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

        addSkinBtn.addActionListener(e -> { safeRun(this::addSkin); saveSkins(); });
        setActiveSkinBtn.addActionListener(e -> { safeRun(this::setActiveSkin); saveSettings(); });
        removeSkinBtn.addActionListener(e -> { safeRun(this::removeSkin); saveSkins(); saveSettings(); });

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
            JOptionPane.showMessageDialog(this, "Cannot remove default skin.", "Skins",
                                          JOptionPane.INFORMATION_MESSAGE);
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
        card.add(title, BorderLayout.NORTH);

        JPanel top = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        top.setOpaque(false);
        top.add(new JLabel("Version:"));

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

        card.add(top, BorderLayout.NORTH);

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
                   - Auto-download and management of IRL Simulator files
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
        langPanel.add(new JLabel("Language:"));
        JComboBox<String> langBox = new JComboBox<>(new String[]{"en-US", "en-GB", "de-DE", "fr-FR"});
        langBox.setSelectedItem(languageCode);
        langBox.addActionListener(e -> {
            languageCode = (String) langBox.getSelectedItem();
            saveSettings();
        });
        langPanel.add(langBox);
        card.add(langPanel);
        card.add(Box.createVerticalStrut(8));

        JPanel msPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        msPanel.setOpaque(false);
        JLabel msLabel = new JLabel("Microsoft account: " + (isSignedInWithMicrosoft ? currentUsername : "Not signed in"));
        msLabel.setForeground(TEXT_SECONDARY);
        msPanel.add(msLabel);
        JButton msButton = new JButton("Change / Sign in");
        msButton.setFont(new Font("SansSerif", Font.PLAIN, 11));
        msButton.addActionListener(e -> {
            simulateMicrosoftSignIn();
            msLabel.setText("Microsoft account: " + (isSignedInWithMicrosoft ? currentUsername : "Not signed in"));
            saveProfile();
        });
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
                "  • INFO\n  • WARN\n  • ERROR\n  • DEBUG\n\n" +
                "Any uncaught game error (like ConcurrentModificationException) will trigger\n" +
                "the global error popup with full stack trace, but the launcher stays open."
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
                "• Manages installations and skins\n" +
                "• Handles auto-downloads and updates\n" +
                "• Runs the game in the same JVM so any uncaught error\n" +
                "  (including ConcurrentModificationException) is captured by\n" +
                "  the global error popup.\n\n" +
                "• Optional live log window that shows everything the game prints,\n" +
                "  with filters for INFO / WARN / ERROR / DEBUG.\n\n" +
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

    // --- Launch logic: SAME JVM, CLASSLOADER, LOG WINDOW, ERROR POPUP ---
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
            throw new FileNotFoundException("IRLSimulator.jar not found after download.");
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
            throw new RuntimeException("BOOT FAILURE: Skin Directory not found (resolved to: " + skinDir + ")");
        }

        String version = "1.1.0";

        String[] args = new String[]{
                "--PathToClasses", pathToClasses,
                "--Name",          name,
                "--skinDir",       skinDir,
                "--version",       version
        };

        SwingUtilities.invokeLater(() -> {
            progressBar.setValue(70);
            setStatus("Launching IRL Simulator (same JVM)...");
        });

        if (showLogWindowOnLaunch) {
            SwingUtilities.invokeLater(() -> {
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
                System.setOut(originalOut);
                System.setErr(originalErr);
                SwingUtilities.invokeLater(() -> setStatus("Game stopped. You can close this or launch again."));
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
            try { Files.deleteIfExists(tempZip); } catch (IOException ignored) {}
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
        } catch (IOException ignored) {}
    }

    private void saveProfile() {
        Properties p = new Properties();
        p.setProperty("username", currentUsername);
        p.setProperty("msSignedIn", Boolean.toString(isSignedInWithMicrosoft));
        File f = new File(DATA_DIR, PROFILE_FILE);
        try (FileOutputStream out = new FileOutputStream(f)) {
            p.store(out, "IRL Launcher Profile");
        } catch (IOException ignored) {}
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
            lastTabKey = p.getProperty("lastTabKey", "home");
            lastPatchNotesVersion = p.getProperty("lastPatchNotesVersion", lastPatchNotesVersion);
            showLogWindowOnLaunch = Boolean.parseBoolean(p.getProperty("showLogWindowOnLaunch", "true"));
            languageCode = p.getProperty("languageCode", "en-US");
        } catch (Exception ignored) {}
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
        } catch (IOException ignored) {}
    }

    private void loadInstallations() {
        File f = new File(DATA_DIR, INSTALLATIONS_FILE);
        if (!f.exists()) return;
        installationModel.clear();
        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\\|", 3);
                if (parts.length == 3) {
                    installationModel.addElement(new Installation(parts[0], parts[1], parts[2]));
                }
            }
        } catch (IOException ignored) {}
    }

    private void saveInstallations() {
        File f = new File(DATA_DIR, INSTALLATIONS_FILE);
        try (PrintWriter pw = new PrintWriter(new FileWriter(f))) {
            for (int i = 0; i < installationModel.size(); i++) {
                Installation inst = installationModel.get(i);
                pw.println(inst.name + "|" + inst.version + "|" + inst.path);
            }
        } catch (IOException ignored) {}
    }

    private void loadSkins() {
        File f = new File(DATA_DIR, SKINS_FILE);
        if (!f.exists()) return;
        skinModel.clear();
        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\\|", 2);
                String name = parts[0];
                String path = parts.length > 1 && !parts[1].isEmpty() ? parts[1] : null;
                skinModel.addElement(new SkinEntry(name, path));
            }
        } catch (IOException ignored) {}
    }

    private void saveSkins() {
        File f = new File(DATA_DIR, SKINS_FILE);
        try (PrintWriter pw = new PrintWriter(new FileWriter(f))) {
            for (int i = 0; i < skinModel.size(); i++) {
                SkinEntry s = skinModel.get(i);
                pw.println(s.name + "|" + (s.path == null ? "" : s.path));
            }
        } catch (IOException ignored) {}
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

    // --- Inner classes ---
    private static class Installation {
        String name;
        String version;
        String path;

        Installation(String name, String version, String path) {
            this.name = name;
            this.version = version;
            this.path = path;
        }

        @Override public String toString() {
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

        @Override public String toString() {
            return name + (path != null ? "  [" + path + "]" : "");
        }
    }

    private static class DottedBackgroundPanel extends JPanel {
        @Override protected void paintComponent(Graphics g) {
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

        private enum LogLevel { INFO, WARN, ERROR, DEBUG }

        private static class LogLine {
            final LogLevel level;
            final String text;
            LogLine(LogLevel level, String text) {
                this.level = level;
                this.text = text;
            }
        }
    }

    // --- Output stream that mirrors to console + log window ---
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

    // --- Global error handler (NO System.exit) ---
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

            if (msg.contains("not found") ||
                msg.contains("missing ui") ||
                msg.contains("icon resource") ||
                msg.contains("could not find file") ||
                msg.contains("no such file or directory")) {
                return true;
            }

            return false;
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
